const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const http = require('http');

dotenv.config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const plannerRoutes = require('./routes/planner');
const statsRoutes = require('./routes/stats');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const habitRoutes = require('./routes/habits');
const { sendDailyDigest, sendWeeklyReport } = require('./services/notificationService');
const { initializeSocket } = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/habits', habitRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Cron Jobs
// Daily digest at 8:00 AM every day
cron.schedule('0 8 * * *', async () => {
  console.log('📧 Sending daily digest emails...');
  await sendDailyDigest();
});

// Weekly report every Sunday at 9:00 AM
cron.schedule('0 9 * * 0', async () => {
  console.log('📊 Sending weekly reports...');
  await sendWeeklyReport();
});

// Evening reminder at 9:00 PM for incomplete tasks
cron.schedule('0 21 * * *', async () => {
  console.log('🔔 Sending evening reminders...');
  await sendDailyDigest('evening');
});

// Auto-delete completed tasks every 6 hours (midnight, 6AM, noon, 6PM)
cron.schedule('0 */6 * * *', async () => {
  try {
    const Task = require('./models/Task');
    const result = await Task.deleteMany({ status: 'completed' });
    console.log(`🗑️ Auto-cleanup: ${result.deletedCount} completed task(s) deleted`);
  } catch (err) {
    console.error('❌ Auto-cleanup error:', err.message);
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = parseInt(process.env.PORT, 10) || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallback = PORT + 1;
    console.warn(`⚠️ Port ${PORT} is busy, trying ${fallback}...`);
    server.listen(fallback, () => {
      console.log(`🚀 Server running on port ${fallback}`);
    });
  } else {
    console.error('❌ Server error:', err);
  }
});
