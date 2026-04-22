// src/controllers/chatbot.controller.js
// AI Chatbot Controller with Groq Integration & Location Services
// Now using Groq API (free tier) for unlimited uptime without quotas

const { chat, clearHistory: clearGroqHistory } = require('../services/groq.service');
const { searchStoresForFood } = require('../services/places.service');
const { getUserLocation } = require('../services/location.service');
const HealthProfile = require('../models/HealthProfile');
const MealPlan = require('../models/MealPlan');
const UserLocation = require('../models/UserLocation');
const { successResponse } = require('../utils/response.utils');

// ─── Load user context in parallel ────────────────────────
const _buildContext = async (user) => {
  const [profile, mealPlan, location] = await Promise.all([
    HealthProfile.findOne({ user: user._id }).lean().catch(() => null),
    MealPlan.findOne({ user: user._id, status: 'active' }).lean().catch(() => null),
    UserLocation.findOne({ user: user._id }).lean().catch(() => null),
  ]);
  return { userName: user.name, profile, mealPlan, location };
};

// ─── Extract store search parameters from message ─────────
const _extractFoodAndLocation = (message, location) => {
  // Match patterns: "Where can I buy <food>", "Find <food> near me"
  const foodMatch = message.match(/(?:buy|find|where.*(?:find|get))\s+(.+?)(?:\s+near|$)/i);
  const foodName = foodMatch?.[1]?.toLowerCase().trim() || null;

  return {
    foodName,
    hasLocation: !!location?.currentLocation?.coordinates,
    latitude: location?.currentLocation?.coordinates?.[1] || null,
    longitude: location?.currentLocation?.coordinates?.[0] || null,
  };
};

/**
 * POST /api/v1/chatbot
 * 
 * Improved response with:
 * - Groq AI for unlimited free access
 * - Location-aware store discovery
 * - Intent routing for smart responses
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    // ─── Input validation ──────────────────────────────────
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Maximum 2000 characters.',
      });
    }

    // ─── Build user context ───────────────────────────────
    const userContext = await _buildContext(req.user);

    // ─── Groq AI Response ─────────────────────────────────
    const aiResponse = await chat(req.user._id, message.trim(), userContext);

    // ─── Check for store search intent ────────────────────
    let stores = [];
    let hasStoreResults = false;
    let foodSearched = null;

    if (aiResponse.intent === 'location_search' && userContext.location) {
      try {
        const { foodName, hasLocation, latitude, longitude } = _extractFoodAndLocation(
          message,
          userContext.location
        );

        if (foodName && hasLocation && latitude && longitude) {
          foodSearched = foodName;
          stores = await searchStoresForFood(
            'grocery', // default category
            foodName,
            latitude,
            longitude,
            5000 // 5km radius
          );
          hasStoreResults = stores.length > 0;

          if (hasStoreResults) {
            console.info(`[Chatbot] Found ${stores.length} stores for "${foodName}"`);
          } else {
            console.warn(`[Chatbot] No stores found for "${foodName}" at ${latitude}, ${longitude}`);
          }
        }
      } catch (storeErr) {
        // Silently fail store search — main AI response is still valid
        console.error('[Chatbot] Store search error:', storeErr.message);
      }
    }

    // ─── Send response ────────────────────────────────────
    return successResponse(
      res,
      {
        userMessage: message.trim(),
        reply: aiResponse.reply,
        intent: aiResponse.intent,
        stores: hasStoreResults ? stores : null,
        hasStoreResults,
        foodSearched,
        tokensEstimate: aiResponse.tokens_used,
        model: aiResponse.model_used,
        timestamp: new Date().toISOString(),
      },
      'Response ready'
    );

  } catch (err) {
    // ─── Comprehensive error handling ──────────────────────
    console.error('[CHATBOT ERROR]', {
      userId: req.user?._id,
      message: err.message,
      status: err.status,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
    });

    // Missing API key
    if (err.message?.includes('GROQ_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Add GROQ_API_KEY to your .env file.',
      });
    }

    // Rate limit (shouldn't happen with Groq free tier)
    if (err.status === 429 || err.message?.includes('overloaded')) {
      return res.status(429).json({
        success: false,
        message: 'AI service is temporarily overloaded. Please try again in a moment.',
      });
    }

    // Invalid API key
    if (err.status === 403 || err.message?.includes('Unauthorized')) {
      return res.status(503).json({
        success: false,
        message: 'AI service authentication failed. Check your Groq API key.',
      });
    }

    // Network errors
    if (err.message?.includes('fetch') || err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Cannot reach AI service. Check your internet connection.',
      });
    }

    // All model fallback failed
    if (err.message?.includes('All AI models failed')) {
      return res.status(503).json({
        success: false,
        message: 'AI service unavailable. Our team is investigating. Please try again later.',
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Chatbot error: ' + err.message?.substring(0, 100),
    });
  }
};

/**
 * DELETE /api/v1/chatbot/history
 * Clear user's conversation history with Groq
 */
const clearChatHistory = async (req, res) => {
  try {
    clearGroqHistory(req.user._id);
    return successResponse(res, {}, 'Conversation history cleared ✓');
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear history.',
    });
  }
};

module.exports = {
  sendMessage,
  clearChatHistory,
};
