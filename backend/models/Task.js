const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['coding', 'study', 'project', 'placement', 'personal', 'health', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed', 'cancelled'],
    default: 'todo'
  },
  dueDate: {
    type: Date,
    default: null
  },
  dueTime: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  }],
  completedAt: {
    type: Date,
    default: null
  },
  reminderAt: {
    type: Date,
    default: null
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null
  },
  estimatedMinutes: {
    type: Number,
    default: null
  },
  actualMinutes: {
    type: Number,
    default: null
  },
  notes: {
    type: String,
    default: '',
    maxlength: 2000
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ user: 1, status: 1, dueDate: 1 });
taskSchema.index({ user: 1, category: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
