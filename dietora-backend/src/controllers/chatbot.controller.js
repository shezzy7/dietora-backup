// src/controllers/chatbot.controller.js

const { chat, clearConversation } = require('../services/gemini.service');
const HealthProfile = require('../models/HealthProfile');
const MealPlan = require('../models/MealPlan');
const UserLocation = require('../models/UserLocation');
const { successResponse } = require('../utils/response.utils');

// Load full user context in parallel — all 3 queries run simultaneously
const _buildContext = async (user) => {
  const [profile, mealPlan, location] = await Promise.all([
    HealthProfile.findOne({ user: user._id }).lean().catch(() => null),
    MealPlan.findOne({ user: user._id, status: 'active' }).lean().catch(() => null),
    UserLocation.findOne({ user: user._id }).lean().catch(() => null),
  ]);
  return { userName: user.name, profile, mealPlan, location };
};

/**
 * POST /api/v1/chatbot
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message too long. Max 2000 characters.' });
    }

    const userContext = await _buildContext(req.user);
    const response = await chat(req.user._id, message.trim(), userContext);

    return successResponse(res, {
      userMessage: message.trim(),
      reply: response.reply,
      stores: response.stores,
      hasStoreResults: response.hasStoreResults,
      foodSearched: response.foodSearched,
      intent: response.intent,
      timestamp: new Date().toISOString(),
    }, 'Response ready');

  } catch (err) {
    // Always log the real error for debugging
    console.error('[CHATBOT ERROR]', {
      message: err.message,
      status: err.status,
      statusText: err.statusText,
      stack: err.stack?.split('\n').slice(0, 4).join('\n'),
    });

    // Missing API key
    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Add GEMINI_API_KEY to your .env file.',
      });
    }

    // Rate limit (429) — err.status is a number from the SDK
    if (err.status === 429 || err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: 'Gemini rate limit reached. Please wait a moment and try again.',
      });
    }

    // Invalid API key (400 or 403)
    if (err.status === 400 || err.status === 403) {
      return res.status(503).json({
        success: false,
        message: `Gemini API error (${err.status}): ${err.message?.substring(0, 120) || 'Check your API key.'}`,
      });
    }

    // Network / timeout
    if (err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network')) {
      return res.status(503).json({
        success: false,
        message: 'Cannot reach Gemini API. Check your internet connection.',
      });
    }

    // All other errors — pass to global handler but with detail
    next(err);
  }
};

/**
 * DELETE /api/v1/chatbot/history
 */
const clearHistory = async (req, res) => {
  clearConversation(req.user._id);
  return successResponse(res, {}, 'Conversation history cleared.');
};

module.exports = { sendMessage, clearHistory };
