const express = require('express');
const Task = require('../models/Task');
const DailyPlan = require('../models/DailyPlan');
const WeeklyPlan = require('../models/WeeklyPlan');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Today range
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    
    // This week range (Monday start)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // This month range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalTasks,
      completedTotal,
      todayTasks,
      todayCompleted,
      weekTasks,
      weekCompleted,
      monthTasks,
      monthCompleted,
      overdueTasks,
      inProgressTasks,
      categoryStats,
      priorityStats,
      recentCompleted,
      upcomingTasks
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({ user: userId, dueDate: { $gte: todayStart, $lte: todayEnd } }),
      Task.countDocuments({ user: userId, dueDate: { $gte: todayStart, $lte: todayEnd }, status: 'completed' }),
      Task.countDocuments({ user: userId, dueDate: { $gte: weekStart, $lte: weekEnd } }),
      Task.countDocuments({ user: userId, dueDate: { $gte: weekStart, $lte: weekEnd }, status: 'completed' }),
      Task.countDocuments({ user: userId, dueDate: { $gte: monthStart, $lte: monthEnd } }),
      Task.countDocuments({ user: userId, dueDate: { $gte: monthStart, $lte: monthEnd }, status: 'completed' }),
      Task.countDocuments({ user: userId, dueDate: { $lt: todayStart }, status: { $nin: ['completed', 'cancelled'] } }),
      Task.countDocuments({ user: userId, status: 'in-progress' }),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$category', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
      ]),
      Task.aggregate([
        { $match: { user: userId, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Task.find({ user: userId, status: 'completed' }).sort('-completedAt').limit(5).select('title completedAt category'),
      Task.find({ user: userId, dueDate: { $gte: todayStart }, status: { $nin: ['completed', 'cancelled'] } }).sort('dueDate').limit(8).select('title dueDate priority category status')
    ]);

    // Streak calculation: consecutive days with at least 1 completed task
    let streak = 0;
    const checkDate = new Date(todayStart);
    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const completedOnDay = await Task.countDocuments({
        user: userId,
        completedAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      if (completedOnDay > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      overview: { totalTasks, completedTotal, overdueTasks, inProgressTasks, streak },
      today: { total: todayTasks, completed: todayCompleted, remaining: todayTasks - todayCompleted },
      week: { total: weekTasks, completed: weekCompleted, remaining: weekTasks - weekCompleted },
      month: { total: monthTasks, completed: monthCompleted, remaining: monthTasks - monthCompleted },
      categoryStats,
      priorityStats,
      recentCompleted,
      upcomingTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Productivity over time (last N days)
router.get('/productivity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user._id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const dailyStats = await Task.aggregate([
      {
        $match: {
          user: userId,
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          completed: { $sum: 1 },
          totalMinutes: { $sum: { $ifNull: ['$actualMinutes', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(dailyStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
