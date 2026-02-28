const express = require('express');
const { protect } = require('../middleware/auth');
const { processAICommand } = require('../services/aiService');

const router = express.Router();
router.use(protect);

// Process AI command
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const result = await processAICommand(req.user._id, message, history);
    res.json(result);
  } catch (error) {
    console.error('AI route error:', error);
    res.status(500).json({ message: 'AI processing failed', error: error.message });
  }
});

module.exports = router;
