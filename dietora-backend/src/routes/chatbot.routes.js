// src/routes/chatbot.routes.js

const express = require('express');
const router = express.Router();
const { sendMessage, clearHistory } = require('../controllers/chatbot.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// POST /api/v1/chatbot       — send message to Gemini AI
router.post('/', sendMessage);

// DELETE /api/v1/chatbot/history — clear conversation history
router.delete('/history', clearHistory);

module.exports = router;
