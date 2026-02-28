const mongoose = require('mongoose');

const weeklyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  weekNumber: {
    type: Number,
    required: true
  },
  goals: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['coding', 'study', 'project', 'placement', 'personal', 'health', 'other'],
      default: 'other'
    }
  }],
  summary: {
    type: String,
    default: '',
    maxlength: 2000
  },
  lessonsLearned: {
    type: String,
    default: '',
    maxlength: 1000
  },
  tasksPlanned: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  overallRating: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  }
}, {
  timestamps: true
});

weeklyPlanSchema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);
