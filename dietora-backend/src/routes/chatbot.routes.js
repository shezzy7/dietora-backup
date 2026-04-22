// src/routes/chatbot.routes.js

const express = require('express');
const router = express.Router();
const { sendMessage, clearChatHistory } = require('../controllers/chatbot.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// POST /api/v1/chatbot       — send message to Groq AI
router.post('/', sendMessage);

// DELETE /api/v1/chatbot/history — clear conversation history
router.delete('/history', clearChatHistory);

module.exports = router;
