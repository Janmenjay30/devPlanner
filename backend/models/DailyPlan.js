const mongoose = require('mongoose');

const dailyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  goals: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  reflection: {
    type: String,
    default: '',
    maxlength: 1000
  },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'bad', 'terrible', ''],
    default: ''
  },
  productivityScore: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }]
}, {
  timestamps: true
});

dailyPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyPlan', dailyPlanSchema);
