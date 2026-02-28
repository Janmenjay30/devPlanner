const express = require('express');
const Habit = require('../models/Habit');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Get all habits
router.get('/', async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const filter = { user: req.user._id };
    if (includeArchived !== 'true') filter.isArchived = false;
    
    const habits = await Habit.find(filter).sort('createdAt');
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create habit
router.post('/', async (req, res) => {
  try {
    const { title, description, icon, color, frequency, customDays, targetPerDay, reminderTime } = req.body;
    
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const habit = await Habit.create({
      user: req.user._id,
      title: title.trim(),
      description,
      icon: icon || '🎯',
      color: color || '#6366f1',
      frequency: frequency || 'daily',
      customDays: customDays || [],
      targetPerDay: targetPerDay || 1,
      reminderTime
    });
    
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle completion for a date
router.post('/:id/toggle', async (req, res) => {
  try {
    const { date } = req.body; // YYYY-MM-DD
    const dateStr = date || new Date().toISOString().split('T')[0];
    
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    
    const existingIdx = habit.completions.findIndex(c => c.date === dateStr);
    
    if (existingIdx > -1) {
      // Already completed — remove it (un-toggle)
      habit.completions.splice(existingIdx, 1);
      habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
    } else {
      // Mark as completed
      habit.completions.push({ date: dateStr, count: 1, completedAt: new Date() });
      habit.totalCompletions += 1;
    }
    
    habit.calculateStreak();
    await habit.save();
    
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update habit
router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Archive/delete habit
router.delete('/:id', async (req, res) => {
  try {
    const { permanent } = req.query;
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    
    if (permanent === 'true') {
      await habit.deleteOne();
      res.json({ message: 'Habit permanently deleted' });
    } else {
      habit.isArchived = true;
      await habit.save();
      res.json({ message: 'Habit archived', habit });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get habit stats/overview
router.get('/stats/overview', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isArchived: false });
    const today = new Date().toISOString().split('T')[0];
    
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    let totalHabits = habits.length;
    let completedToday = 0;
    let totalStreak = 0;
    let bestStreak = 0;
    let dueToday = 0;
    
    // Last 7 days completion rate
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      let dueCount = 0;
      let doneCount = 0;
      
      habits.forEach(h => {
        if (h.isDueOn(d)) {
          dueCount++;
          if (h.completions.some(c => c.date === dateStr)) {
            doneCount++;
          }
        }
      });
      
      last7Days.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        due: dueCount,
        done: doneCount,
        rate: dueCount > 0 ? Math.round((doneCount / dueCount) * 100) : 0
      });
    }
    
    habits.forEach(h => {
      if (h.completions.some(c => c.date === today)) completedToday++;
      if (h.isDueOn(todayDate)) dueToday++;
      totalStreak += h.currentStreak;
      if (h.longestStreak > bestStreak) bestStreak = h.longestStreak;
    });
    
    res.json({
      totalHabits,
      dueToday,
      completedToday,
      remainingToday: dueToday - completedToday,
      avgStreak: totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0,
      bestStreak,
      last7Days
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
