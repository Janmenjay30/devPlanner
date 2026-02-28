const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const DailyPlan = require('../models/DailyPlan');
const WeeklyPlan = require('../models/WeeklyPlan');
const Notification = require('../models/Notification');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models in priority order — if one hits quota, try the next
// Optimized for 2026 Free Tier
const MODEL_CHAIN = [
  'gemini-2.5-flash-lite', // Best for Free Tier: 15 RPM / 1,000 RPD
  'gemini-2.5-flash',      // Stable workhorse
  'gemini-3-flash-preview' // Newest model (if available in your region)
];
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 3000; // ms

const SYSTEM_PROMPT = `You are DevPlanner AI — a smart productivity assistant integrated into a task management app. The user is a final year BTech CSE student and developer.

You can perform the following ACTIONS by responding with JSON. Always respond with a JSON object containing "action" and "message" fields.

AVAILABLE ACTIONS:

1. CREATE_TASK - Create a new task
   { "action": "CREATE_TASK", "data": { "title": "string (required)", "description": "string", "category": "coding|study|project|placement|personal|health|other", "priority": "low|medium|high|urgent", "dueDate": "YYYY-MM-DD or null", "dueTime": "HH:MM or null", "tags": ["tag1", "tag2"], "subtasks": [{"title": "subtask1"}, {"title": "subtask2"}], "estimatedMinutes": number }, "message": "friendly confirmation message" }

2. CREATE_MULTIPLE_TASKS - Create several tasks at once
   { "action": "CREATE_MULTIPLE_TASKS", "data": [{ "title": "...", "category": "...", "priority": "...", "dueDate": "..." }, ...], "message": "confirmation" }

3. COMPLETE_TASK - Mark a task as completed (user provides title/description to find it)
   { "action": "COMPLETE_TASK", "data": { "searchQuery": "search text to find the task" }, "message": "confirmation" }

4. DELETE_TASK - Delete a task
   { "action": "DELETE_TASK", "data": { "searchQuery": "search text to find the task" }, "message": "confirmation" }

5. UPDATE_TASK - Update a task's fields
   { "action": "UPDATE_TASK", "data": { "searchQuery": "search text to find the task", "updates": { "title": "new title", "priority": "high", "dueDate": "2026-03-01", "status": "in-progress", "category": "coding" } }, "message": "confirmation" }

6. LIST_TASKS - Show tasks with optional filters
   { "action": "LIST_TASKS", "data": { "status": "todo|in-progress|completed|cancelled", "category": "coding|study|...", "priority": "low|medium|high|urgent", "dueDate": "today|week|overdue" }, "message": "summary message" }

7. ADD_DAILY_GOAL - Add a goal to today's daily plan
   { "action": "ADD_DAILY_GOAL", "data": { "date": "YYYY-MM-DD", "goal": "goal text" }, "message": "confirmation" }

8. ADD_WEEKLY_GOAL - Add a goal to this week's plan
   { "action": "ADD_WEEKLY_GOAL", "data": { "goal": "goal text", "category": "coding|study|..." }, "message": "confirmation" }

9. GET_STATS - Get productivity stats
   { "action": "GET_STATS", "data": {}, "message": "stats summary" }

10. CHAT - For general conversation, advice, or when no action is needed
    { "action": "CHAT", "data": {}, "message": "your helpful response" }

RULES:
- Always respond with VALID JSON only. No markdown, no code blocks, just raw JSON.
- Today's date is ${new Date().toISOString().split('T')[0]}.
- Be smart about inferring category from context (e.g. "LeetCode" → coding, "resume" → placement, "gym" → health).
- If user says "tomorrow", calculate the correct date.
- For vague requests, make reasonable assumptions and mention them in your message.
- Be concise, friendly, and use relevant emojis in messages.
- When user says things like "add", "create", "make" → CREATE_TASK
- When user says "done", "finished", "completed" → COMPLETE_TASK
- When user says "remove", "delete", "cancel" → DELETE_TASK
- When user says "show", "list", "what are my" → LIST_TASKS
- When user says "update", "change", "modify", "move to", "set priority" → UPDATE_TASK
`;

// Parse AI response safely
function parseAIResponse(text) {
  try {
    // Try direct JSON parse
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {}
    }
    // Try to find JSON object in text
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {}
    }
    // Fallback to chat
    return { action: 'CHAT', data: {}, message: text };
  }
}

// Execute the action returned by AI
async function executeAction(userId, aiResponse) {
  const { action, data, message } = aiResponse;

  switch (action) {
    case 'CREATE_TASK': {
      const taskData = {
        user: userId,
        title: data.title,
        description: data.description || '',
        category: data.category || 'other',
        priority: data.priority || 'medium',
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || null,
        tags: data.tags || [],
        subtasks: (data.subtasks || []).map(s => ({ title: s.title || s, completed: false })),
        estimatedMinutes: data.estimatedMinutes || null,
        status: 'todo'
      };
      const task = await Task.create(taskData);
      return { message, action, task, success: true };
    }

    case 'CREATE_MULTIPLE_TASKS': {
      const tasks = [];
      for (const t of data) {
        const task = await Task.create({
          user: userId,
          title: t.title,
          description: t.description || '',
          category: t.category || 'other',
          priority: t.priority || 'medium',
          dueDate: t.dueDate || null,
          tags: t.tags || [],
          subtasks: (t.subtasks || []).map(s => ({ title: s.title || s, completed: false })),
          status: 'todo'
        });
        tasks.push(task);
      }
      return { message, action, tasks, success: true };
    }

    case 'COMPLETE_TASK': {
      const task = await Task.findOne({
        user: userId,
        title: { $regex: data.searchQuery, $options: 'i' },
        status: { $ne: 'completed' }
      });
      if (!task) {
        return { message: `❌ Couldn't find a task matching "${data.searchQuery}". Try being more specific!`, action, success: false };
      }
      task.status = 'completed';
      task.completedAt = new Date();
      await task.save();
      return { message, action, task, success: true };
    }

    case 'DELETE_TASK': {
      const task = await Task.findOne({
        user: userId,
        title: { $regex: data.searchQuery, $options: 'i' }
      });
      if (!task) {
        return { message: `❌ Couldn't find a task matching "${data.searchQuery}". Try being more specific!`, action, success: false };
      }
      await Task.deleteOne({ _id: task._id });
      return { message, action, deletedTask: task.title, success: true };
    }

    case 'UPDATE_TASK': {
      const task = await Task.findOne({
        user: userId,
        title: { $regex: data.searchQuery, $options: 'i' }
      });
      if (!task) {
        return { message: `❌ Couldn't find a task matching "${data.searchQuery}".`, action, success: false };
      }
      Object.assign(task, data.updates);
      if (data.updates.status === 'completed' && task.status !== 'completed') {
        task.completedAt = new Date();
      }
      await task.save();
      return { message, action, task, success: true };
    }

    case 'LIST_TASKS': {
      const filter = { user: userId };
      if (data.status) filter.status = data.status;
      if (data.category) filter.category = data.category;
      if (data.priority) filter.priority = data.priority;
      
      if (data.dueDate === 'today') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        filter.dueDate = { $gte: start, $lte: end };
      } else if (data.dueDate === 'week') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setDate(end.getDate() + 7);
        filter.dueDate = { $gte: start, $lte: end };
      } else if (data.dueDate === 'overdue') {
        filter.dueDate = { $lt: new Date() };
        filter.status = { $nin: ['completed', 'cancelled'] };
      }

      const tasks = await Task.find(filter).sort('-createdAt').limit(20);
      
      let taskSummary = message + '\n\n';
      if (tasks.length === 0) {
        taskSummary += 'No tasks found with these filters.';
      } else {
        tasks.forEach((t, i) => {
          const statusEmoji = { 'todo': '⭕', 'in-progress': '🔄', 'completed': '✅', 'cancelled': '❌' };
          const priorityEmoji = { 'low': '🔵', 'medium': '🟡', 'high': '🟠', 'urgent': '🔴' };
          taskSummary += `${statusEmoji[t.status] || '⭕'} ${priorityEmoji[t.priority] || ''} **${t.title}** [${t.category}]`;
          if (t.dueDate) taskSummary += ` — Due: ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          taskSummary += '\n';
        });
      }
      
      return { message: taskSummary, action, tasks, success: true };
    }

    case 'ADD_DAILY_GOAL': {
      const date = new Date(data.date || new Date().toISOString().split('T')[0]);
      date.setHours(0, 0, 0, 0);

      let plan = await DailyPlan.findOne({ user: userId, date });
      if (!plan) {
        plan = await DailyPlan.create({ user: userId, date, goals: [] });
      }
      plan.goals.push({ text: data.goal, completed: false });
      await plan.save();
      return { message, action, success: true };
    }

    case 'ADD_WEEKLY_GOAL': {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let plan = await WeeklyPlan.findOne({ user: userId, weekStart });
      if (!plan) {
        const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((weekStart - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        plan = await WeeklyPlan.create({ user: userId, weekStart, weekEnd, weekNumber, goals: [] });
      }
      plan.goals.push({ text: data.goal, completed: false, category: data.category || 'other' });
      await plan.save();
      return { message, action, success: true };
    }

    case 'GET_STATS': {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

      const [total, completed, todayTotal, todayDone, inProgress, overdue] = await Promise.all([
        Task.countDocuments({ user: userId }),
        Task.countDocuments({ user: userId, status: 'completed' }),
        Task.countDocuments({ user: userId, dueDate: { $gte: todayStart, $lte: todayEnd } }),
        Task.countDocuments({ user: userId, dueDate: { $gte: todayStart, $lte: todayEnd }, status: 'completed' }),
        Task.countDocuments({ user: userId, status: 'in-progress' }),
        Task.countDocuments({ user: userId, dueDate: { $lt: todayStart }, status: { $nin: ['completed', 'cancelled'] } })
      ]);

      const statsMsg = `📊 **Your Stats:**\n` +
        `• Total Tasks: ${total}\n` +
        `• Completed: ${completed} (${total > 0 ? Math.round(completed/total*100) : 0}%)\n` +
        `• In Progress: ${inProgress}\n` +
        `• Today: ${todayDone}/${todayTotal} done\n` +
        `• Overdue: ${overdue}\n\n` +
        message;

      return { message: statsMsg, action, success: true };
    }

    case 'CHAT':
    default:
      return { message, action: 'CHAT', success: true };
  }
}

// Try sending a message with a specific model
async function tryModel(modelName, userMessage, conversationHistory) {
  const model = genAI.getGenerativeModel({ model: modelName });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'System Instructions: ' + SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: JSON.stringify({ action: 'CHAT', data: {}, message: "Hey! I'm your DevPlanner AI assistant 🚀 I can create tasks, mark them done, delete them, show your stats, and more. Just tell me what you need!" }) }]
      },
      ...conversationHistory
        .map(msg => {
          // Handle both formats: { parts: [{ text }] } from frontend, or { content: '...' }
          const text = msg.parts?.[0]?.text || msg.content || '';
          if (!text) return null; // skip empty entries
          return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(text) }]
          };
        })
        .filter(Boolean)
    ]
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main AI processing function with fallback models & retry
async function processAICommand(userId, userMessage, conversationHistory = []) {
  let lastError = null;

  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
          console.log(`⏳ Retry ${attempt}/${MAX_RETRIES} for ${modelName} after ${delay}ms...`);
          await sleep(delay);
        }

        const responseText = await tryModel(modelName, userMessage, conversationHistory);
        const aiResponse = parseAIResponse(responseText);
        const executionResult = await executeAction(userId, aiResponse);
        return executionResult;
      } catch (error) {
        lastError = error;

        // 429 = rate limit / quota
        if (error.status === 429) {
          const isDaily = error.message?.includes('per day') || 
                          error.errorDetails?.some(d => 
                            d.violations?.some(v => v.quotaId?.includes('PerDay')));

          if (isDaily) {
            // Daily quota exhausted — skip retries, try next model
            console.warn(`⚠️ Daily quota exhausted for ${modelName}, trying next model...`);
            break;
          }
          // Per-minute limit — retry with backoff
          console.warn(`⚠️ Rate limited on ${modelName} (attempt ${attempt + 1})`);
          continue;
        }

        // Non-rate-limit errors — don't retry
        console.error(`AI error on ${modelName}:`, error.message);
        break;
      }
    }
  }

  // All models / retries exhausted
  console.error('AI processing error (all models failed):', lastError);

  if (lastError?.status === 429) {
    return {
      message: '⚠️ The AI is temporarily rate-limited. Your free daily quota has been used up — it resets at midnight Pacific Time. Please try again later or upgrade your Gemini API plan at https://ai.google.dev.',
      action: 'CHAT',
      success: false
    };
  }

  return {
    message: `⚠️ AI Error: ${lastError?.message || 'Unknown error'}. Make sure your Gemini API key is configured in .env`,
    action: 'CHAT',
    success: false
  };
}

module.exports = { processAICommand };
