const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Notification = require('../models/Notification');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate AI-powered daily summary using Gemini
const generateAISummary = async (user, tasks, overdueTasks, habits, stats) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const completedHabits = habits.filter(h => {
      const today = new Date().toISOString().split('T')[0];
      return h.completions.some(c => c.date.toISOString().split('T')[0] === today);
    });

    const prompt = `You are DevPlanner AI, a motivational productivity coach. Generate a short, personalized daily email summary (3-5 sentences) for a BTech CSE student named ${user.name}.

Today's data:
- Tasks scheduled: ${stats.todayTotal}
- Completed: ${stats.todayCompleted}
- Remaining: ${stats.todayRemaining}
- Overdue tasks: ${overdueTasks.length}
- Active habits: ${habits.length}
- Habits completed today: ${completedHabits.length}
- Top priority tasks: ${tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').map(t => t.title).join(', ') || 'None'}

Rules:
- Be encouraging but honest
- Mention specific tasks/habits if relevant
- Include one productivity tip
- Keep it under 100 words
- Use a casual, friendly tone
- Return ONLY the summary text, no JSON`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI summary generation failed, using fallback:', error.message);
    return null; // Fallback to static summary
  }
};

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"DevPlanner" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Generate daily digest HTML
const generateDailyDigestHTML = (user, tasks, overdue, stats, aiSummary = null) => {
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <!DOCTYPE html>
    <html>
    <head><style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; }
      .header h1 { margin: 0; color: white; font-size: 24px; }
      .header p { margin: 5px 0 0; color: #e0e7ff; }
      .content { padding: 24px; }
      .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
      .stat-card { background: #334155; padding: 16px; border-radius: 12px; text-align: center; }
      .stat-card .number { font-size: 28px; font-weight: bold; color: #818cf8; }
      .stat-card .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; }
      .task-item { padding: 12px; border-left: 3px solid #6366f1; margin: 8px 0; background: #334155; border-radius: 0 8px 8px 0; }
      .overdue { border-left-color: #ef4444; }
      .priority-high { color: #f97316; }
      .priority-urgent { color: #ef4444; }
      .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
      .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 DevPlanner Daily Digest</h1>
          <p>${todayStr}</p>
        </div>
        <div class="content">
          <p>Hey ${user.name}! Here's your daily overview:</p>
          
          ${aiSummary ? `
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 16px; border-radius: 12px; margin: 16px 0; color: white;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 18px;">🤖</span>
                <strong style="font-size: 14px;">AI Daily Summary</strong>
              </div>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; opacity: 0.95;">${aiSummary}</p>
            </div>
          ` : ''}

          <div class="stat-grid">
            <div class="stat-card">
              <div class="number">${stats.todayTotal}</div>
              <div class="label">Today's Tasks</div>
            </div>
            <div class="stat-card">
              <div class="number">${stats.todayCompleted}</div>
              <div class="label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="number">${stats.todayRemaining}</div>
              <div class="label">Remaining</div>
            </div>
            <div class="stat-card">
              <div class="number">${overdue.length}</div>
              <div class="label">Overdue</div>
            </div>
          </div>

          ${tasks.length > 0 ? `
            <h3>📋 Today's Tasks</h3>
            ${tasks.map(t => `
              <div class="task-item">
                <strong>${t.title}</strong>
                <span class="priority-${t.priority}">[${t.priority}]</span>
                ${t.status === 'completed' ? ' ✅' : ''}
              </div>
            `).join('')}
          ` : '<p>No tasks scheduled for today.</p>'}

          ${overdue.length > 0 ? `
            <h3>⚠️ Overdue Tasks</h3>
            ${overdue.map(t => `
              <div class="task-item overdue">
                <strong>${t.title}</strong> - Due: ${new Date(t.dueDate).toLocaleDateString()}
              </div>
            `).join('')}
          ` : ''}

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}" class="cta">Open DevPlanner</a>
          </div>
        </div>
        <div class="footer">
          <p>DevPlanner - Your productivity companion 💻</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send daily digest to all users
const sendDailyDigest = async (timeOfDay = 'morning') => {
  try {
    const users = await User.find({ 'preferences.emailNotifications': true });

    for (const user of users) {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

      const [todayTasks, overdueTasks, todayCompleted, habits] = await Promise.all([
        Task.find({ user: user._id, dueDate: { $gte: todayStart, $lte: todayEnd } }),
        Task.find({ user: user._id, dueDate: { $lt: todayStart }, status: { $nin: ['completed', 'cancelled'] } }),
        Task.countDocuments({ user: user._id, dueDate: { $gte: todayStart, $lte: todayEnd }, status: 'completed' }),
        Habit.find({ user: user._id, isArchived: false })
      ]);

      const stats = {
        todayTotal: todayTasks.length,
        todayCompleted,
        todayRemaining: todayTasks.length - todayCompleted
      };

      // Generate AI summary
      const aiSummary = await generateAISummary(user, todayTasks, overdueTasks, habits, stats);

      const subject = timeOfDay === 'morning'
        ? `🌅 Good Morning! You have ${stats.todayRemaining} tasks today`
        : `🌙 Evening Check: ${stats.todayRemaining} tasks remaining today`;

      const html = generateDailyDigestHTML(user, todayTasks, overdueTasks, stats, aiSummary);
      await sendEmail(user.email, subject, html);

      // Create in-app notification
      await Notification.create({
        user: user._id,
        title: timeOfDay === 'morning' ? 'Daily Digest' : 'Evening Reminder',
        message: `You have ${stats.todayRemaining} tasks remaining today. ${overdueTasks.length} overdue.`,
        type: 'daily-digest'
      });
    }
  } catch (error) {
    console.error('Daily digest error:', error);
  }
};

// Send weekly report to all users
const sendWeeklyReport = async () => {
  try {
    const users = await User.find({ 'preferences.emailNotifications': true });

    for (const user of users) {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const [totalWeek, completedWeek, categoryBreakdown] = await Promise.all([
        Task.countDocuments({ user: user._id, createdAt: { $gte: weekStart } }),
        Task.countDocuments({ user: user._id, completedAt: { $gte: weekStart } }),
        Task.aggregate([
          { $match: { user: user._id, completedAt: { $gte: weekStart } } },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ])
      ]);

      const completionRate = totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 0;

      const subject = `📊 Weekly Report: ${completionRate}% completion rate`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head><style>
          body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #06b6d4, #6366f1); padding: 30px; text-align: center; }
          .header h1 { margin: 0; color: white; }
          .content { padding: 24px; }
          .big-stat { text-align: center; font-size: 48px; font-weight: bold; color: #6366f1; margin: 20px 0; }
          .stat-row { display: flex; justify-content: space-around; margin: 16px 0; }
          .stat-item { text-align: center; }
          .stat-item .num { font-size: 24px; font-weight: bold; color: #818cf8; }
          .stat-item .lbl { font-size: 12px; color: #94a3b8; }
          .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Report</h1>
              <p>Your week in review</p>
            </div>
            <div class="content">
              <p>Hey ${user.name}! Here's how your week went:</p>
              <div class="big-stat">${completionRate}%</div>
              <p style="text-align:center;color:#94a3b8;">Completion Rate</p>
              <div class="stat-row">
                <div class="stat-item"><div class="num">${totalWeek}</div><div class="lbl">Total Tasks</div></div>
                <div class="stat-item"><div class="num">${completedWeek}</div><div class="lbl">Completed</div></div>
                <div class="stat-item"><div class="num">${totalWeek - completedWeek}</div><div class="lbl">Remaining</div></div>
              </div>
              ${categoryBreakdown.length > 0 ? `
                <h3>Category Breakdown</h3>
                ${categoryBreakdown.map(c => `<p>📌 ${c._id}: ${c.count} completed</p>`).join('')}
              ` : ''}
              <div style="text-align:center;"><a href="${process.env.CLIENT_URL}" class="cta">View Full Report</a></div>
            </div>
            <div class="footer"><p>DevPlanner - Keep pushing! 🚀</p></div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(user.email, subject, html);

      await Notification.create({
        user: user._id,
        title: 'Weekly Report',
        message: `This week: ${completedWeek}/${totalWeek} tasks completed (${completionRate}% rate)`,
        type: 'weekly-report'
      });
    }
  } catch (error) {
    console.error('Weekly report error:', error);
  }
};

module.exports = { sendEmail, sendDailyDigest, sendWeeklyReport };
