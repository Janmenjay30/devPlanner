const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🎯' },
  color: { type: String, default: '#6366f1' },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekdays', 'weekends', 'custom'], 
    default: 'daily' 
  },
  customDays: [{ type: Number, min: 0, max: 6 }], // 0=Sun, 6=Sat
  targetPerDay: { type: Number, default: 1 },
  completions: [{
    date: { type: String, required: true }, // YYYY-MM-DD
    count: { type: Number, default: 1 },
    completedAt: { type: Date, default: Date.now }
  }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalCompletions: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  startDate: { type: Date, default: Date.now },
  reminderTime: { type: String, default: null }, // HH:MM
}, { timestamps: true });

// Index for fast queries
habitSchema.index({ user: 1, isArchived: 1 });
habitSchema.index({ 'completions.date': 1 });

// Calculate streak from completions
habitSchema.methods.calculateStreak = function() {
  if (this.completions.length === 0) {
    this.currentStreak = 0;
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dates = [...new Set(this.completions.map(c => c.date))].sort().reverse();
  
  let streak = 0;
  const checkDate = new Date(today);
  
  // Check if today or yesterday has a completion (allow 1 day grace)
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) {
    this.currentStreak = 0;
    return;
  }
  
  // If today not done, start checking from yesterday
  if (!dates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    
    // Check if this day is a scheduled day
    if (this.isDueOn(checkDate)) {
      if (dates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  this.currentStreak = streak;
  if (streak > this.longestStreak) {
    this.longestStreak = streak;
  }
};

// Check if habit is due on a given date
habitSchema.methods.isDueOn = function(date) {
  const day = date.getDay();
  switch (this.frequency) {
    case 'daily': return true;
    case 'weekdays': return day >= 1 && day <= 5;
    case 'weekends': return day === 0 || day === 6;
    case 'custom': return this.customDays.includes(day);
    default: return true;
  }
};

module.exports = mongoose.model('Habit', habitSchema);
