const express = require('express');
const DailyPlan = require('../models/DailyPlan');
const WeeklyPlan = require('../models/WeeklyPlan');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ===== DAILY PLANS =====

// Get daily plan for a specific date
router.get('/daily/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    let plan = await DailyPlan.findOne({ user: req.user._id, date }).populate('tasks');
    
    if (!plan) {
      // Auto-create plan with tasks due today
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const todayTasks = await Task.find({
        user: req.user._id,
        dueDate: { $gte: dayStart, $lte: dayEnd }
      });

      plan = await DailyPlan.create({
        user: req.user._id,
        date,
        tasks: todayTasks.map(t => t._id),
        goals: []
      });

      plan = await DailyPlan.findById(plan._id).populate('tasks');
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update daily plan
router.put('/daily/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const plan = await DailyPlan.findOneAndUpdate(
      { user: req.user._id, date },
      { ...req.body, user: req.user._id, date },
      { new: true, upsert: true }
    ).populate('tasks');

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get daily plans for a date range
router.get('/daily', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const plans = await DailyPlan.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    }).populate('tasks').sort('date');

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===== WEEKLY PLANS =====

// Get weekly plan
router.get('/weekly/:weekStart', async (req, res) => {
  try {
    const weekStart = new Date(req.params.weekStart);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let plan = await WeeklyPlan.findOne({ user: req.user._id, weekStart });

    if (!plan) {
      // Calculate week number
      const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((weekStart - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

      // Count tasks for this week
      const tasksInWeek = await Task.countDocuments({
        user: req.user._id,
        dueDate: { $gte: weekStart, $lte: weekEnd }
      });

      const completedInWeek = await Task.countDocuments({
        user: req.user._id,
        dueDate: { $gte: weekStart, $lte: weekEnd },
        status: 'completed'
      });

      plan = await WeeklyPlan.create({
        user: req.user._id,
        weekStart,
        weekEnd,
        weekNumber,
        tasksPlanned: tasksInWeek,
        tasksCompleted: completedInWeek,
        goals: []
      });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update weekly plan
router.put('/weekly/:weekStart', async (req, res) => {
  try {
    const weekStart = new Date(req.params.weekStart);
    weekStart.setHours(0, 0, 0, 0);

    const plan = await WeeklyPlan.findOneAndUpdate(
      { user: req.user._id, weekStart },
      { ...req.body },
      { new: true, upsert: true }
    );

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all weekly plans
router.get('/weekly', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const plans = await WeeklyPlan.find({ user: req.user._id })
      .sort('-weekStart')
      .limit(parseInt(limit));
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
