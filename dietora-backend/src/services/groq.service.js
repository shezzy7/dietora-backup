// src/services/groq.service.js
// AI Orchestration Layer using Groq API (Free tier - No quota limits)
//
// Model Selection Strategy:
//   Primary:   mixtral-8x7b-32768 (fast, great for nutrition Q&A)
//   Fallback:  llama2-70b-4096 (more accurate, slower)
//
// Features:
//   - Per-user conversation history (max 10 turns)
//   - Intelligent retry logic (exponential backoff)
//   - Token optimization (context window awareness)
//   - Comprehensive error handling
//   - Multi-model failover
//   - System prompt engineering for nutrition domain

const Groq = require('groq-sdk');

// ─── Configuration ────────────────────────────────────────
const MODELS = {
  primary: 'mixtral-8x7b-32768',   // 32K context, fastest (free tier)
  fallback: 'llama2-70b-4096',     // 4K context, more accurate
};

const MAX_TURNS = 10;              // Max conversation history
const CONTEXT_LIMIT = 6000;        // Reserve tokens for response
const RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 5000, 10000]; // Exponential backoff

// ─── Client (lazy init) ───────────────────────────────────
let _groqClient = null;
const getClient = () => {
  if (!_groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing from .env');
    }
    _groqClient = new Groq({ apiKey });
  }
  return _groqClient;
};

// ─── Per-user conversation history (in-memory) ────────────
const _historyStore = new Map();
const _getHistory = (uid) => _historyStore.get(String(uid)) || [];
const _setHistory = (uid, h) => {
  // Keep only last MAX_TURNS * 2 entries (user + assistant)
  const limited = h.slice(-MAX_TURNS * 2);
  _historyStore.set(String(uid), limited);
};
const _clearHistory = (uid) => _historyStore.delete(String(uid));

// ─── System Prompt Builder (Enhanced for Nutrition Domain) ─
const _buildSystemPrompt = ({ profile, mealPlan, location, userName }) => {
  const lines = [
    'You are DIETORA AI, an expert nutrition and diet planning assistant specialized in Pakistani cuisine.',
    '',
    '━━━ CORE EXPERTISE ━━━',
    'Domain Knowledge:',
    '• Pakistani food culture (roti, dal, biryani, karahi, pulao, sabzi, etc.)',
    '• Medical nutrition: diabetes, hypertension, cardiac disease management',
    '• Weight management: evidence-based calorie & macro calculations',
    '• Budget optimization: maximizing nutrition per PKR spent',
    '• Allergy & dietary restrictions: safe food substitutions',
    '',
    '🎯 TONE & STYLE:',
    '• Professional yet warm and approachable',
    '• Use cultural context naturally (e.g., "dal is excellent protein")',
    '• Concise responses (max 3 sentences per question unless asked for detail)',
    '• Support both English and Roman Urdu naturally',
    '• When asked "where to buy" → be direct and helpful',
    '',
    '━━━ USER CONTEXT ━━━',
    `Name: ${userName || 'Friend'}`,
  ];

  if (profile) {
    const bmiCategory = profile.bmi < 18.5 ? 'Underweight' : 
                        profile.bmi < 25 ? 'Healthy' : 
                        profile.bmi < 30 ? 'Overweight' : 'Obese';
    
    lines.push(
      '',
      '📊 HEALTH PROFILE:',
      `• Demographics: ${profile.age}y ${profile.gender.charAt(0).toUpperCase()} | ${profile.height}cm tall, ${profile.weight}kg`,
      `• BMI: ${profile.bmi.toFixed(1)} (${bmiCategory}) | BMR: ${profile.bmr.toFixed(0)} kcal | TDEE: ${profile.tdee.toFixed(0)} kcal`,
      `• Daily Target: ${profile.dailyCalorieTarget} kcal | Goal: ${profile.goal.replace(/_/g, ' ').toUpperCase()}`,
      `• Activity: ${profile.activityLevel.replace(/_/g, ' ').toUpperCase()}`,
      `• Budget: PKR ${profile.dailyBudget}/day`,
    );

    const conditions = [
      profile.isDiabetic && '🩺 DIABETES',
      profile.isHypertensive && '🫀 HYPERTENSION',
      profile.isCardiac && '❤️ CARDIAC',
    ].filter(Boolean).join(' | ');

    if (conditions) {
      lines.push(`• Medical: ${conditions}`);
      lines.push('  → Restrict high glycemic index, high sodium, high saturated fat foods');
    }

    if (profile.allergies?.length) {
      lines.push(`• Allergies: ${profile.allergies.join(', ').toUpperCase()}`);
      lines.push('  → NEVER suggest these foods');
    } else {
      lines.push('• Allergies: None reported');
    }

    lines.push(
      '',
      '💡 KEY GUIDANCE:',
      '• Macro split: ~30% protein, ~40% carbs, ~30% fat',
      '• Protein target: 0.8-1.2g per kg body weight',
      '• Emphasize: local, seasonal, affordable Pakistani foods',
      '• Meal frequency: 3 meals + 1 snack recommended',
    );
  } else {
    lines.push(
      '',
      '⚠️ Health profile NOT SET — ask user to create one at Profile page'
    );
  }

  if (mealPlan) {
    lines.push(
      '',
      '🍽️ ACTIVE MEAL PLAN:',
      `• Generated: ${new Date(mealPlan.createdAt).toLocaleDateString('en-PK')}`,
      `• Status: ${mealPlan.status}`,
      `• Weekly budget: PKR ${mealPlan.totalWeekCost}`,
    );
  }

  if (location?.manualCity || location?.resolvedCity) {
    lines.push(
      '',
      `📍 LOCATION: ${location.manualCity || location.resolvedCity}`,
    );
  }

  lines.push(
    '',
    '━━━ RESPONSE GUARDRAILS ━━━',
    '✅ DO:',
    '  - Answer nutrition and diet questions',
    '  - Suggest Pakistani food substitutions',
    '  - Help with budget optimization',
    '  - Discuss health conditions in nutrition context',
    '  - Use emojis sparingly (only 1-2 per response)',
    '',
    '❌ DON\'T:',
    '  - Provide medical advice (use "consult your doctor")',
    '  - Suggest foods user is allergic to',
    '  - Recommend foods unsafe for their conditions',
    '  - Suggest expensive items beyond budget',
    '  - Give generic advice ("eat more vegetables") — be specific',
  );

  return lines.join('\n');
};

// ─── Retry Logic with Exponential Backoff ────────────────
const _withRetry = async (fn, modelName = MODELS.primary, attemptNum = 0) => {
  try {
    return await fn();
  } catch (err) {
    const isQuotaError = err?.status === 429 || err?.message?.includes('429');
    const isRateLimit = err?.message?.includes('rate') || err?.message?.includes('overloaded');
    const isRetryable = isQuotaError || isRateLimit || err?.status === 503;

    if (isRetryable && attemptNum < RETRY_ATTEMPTS) {
      const delayMs = RETRY_DELAYS_MS[attemptNum] || 10000;
      console.warn(
        `[Groq][${modelName}] Retryable error (attempt ${attemptNum + 1}/${RETRY_ATTEMPTS}):`,
        `${err.status || 'Unknown'} — ${err.message?.substring(0, 80)}`,
        `Waiting ${delayMs}ms...`
      );
      await new Promise((r) => setTimeout(r, delayMs));
      return _withRetry(fn, modelName, attemptNum + 1);
    }

    throw err;
  }
};

// ─── Model Fallover Strategy ──────────────────────────────
const _callModelWithFallover = async (messages, model = MODELS.primary) => {
  const currentModel = model;

  try {
    return await _withRetry(async () => {
      const client = getClient();
      const response = await client.chat.completions.create({
        model: currentModel,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || '';
    }, currentModel);
  } catch (primaryErr) {
    console.error(`[Groq] Primary model (${currentModel}) failed:`, primaryErr.message);

    // Fallback to secondary model if available
    if (model === MODELS.primary && MODELS.fallback !== currentModel) {
      console.info(`[Groq] Falling back to ${MODELS.fallback}...`);
      try {
        return await _callModelWithFallover(messages, MODELS.fallback);
      } catch (fallbackErr) {
        console.error(`[Groq] Fallback model also failed:`, fallbackErr.message);
        throw new Error(
          `All AI models failed. Primary: ${primaryErr.message}. Fallback: ${fallbackErr.message}`
        );
      }
    }

    throw primaryErr;
  }
};

// ─── Intent Detection (Rule-based pre-check) ──────────────
const _detectIntent = (message) => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.match(/(where|find|buy|store|shop|market|grocer|kiryana|mandi)/i)) {
    return 'location_search';
  }
  if (lowerMsg.match(/(bmi|mifflin|calorie|tdee|bmr|metabol)/i)) {
    return 'health_calculation';
  }
  if (lowerMsg.match(/(budget|cost|price|afford|cheap|expensive|pkr)/i)) {
    return 'budget_query';
  }
  if (lowerMsg.match(/(diabetes|diabetic|blood sugar|glucose|hyperglycemic)/i)) {
    return 'diabetes_diet';
  }
  if (lowerMsg.match(/(pressure|hypertension|blood pressure|sodium|salt)/i)) {
    return 'hypertension_diet';
  }
  if (lowerMsg.match(/(heart|cardiac|cholesterol|fat|lipid|artery)/i)) {
    return 'cardiac_diet';
  }
  if (lowerMsg.match(/(allerg|intoleran|avoid|cannot eat|safe)/i)) {
    return 'allergy_query';
  }

  return 'general_nutrition';
};

// ═══════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════

/**
 * chat() — Main AI conversation endpoint
 *
 * @param {String} userId — user's MongoDB ObjectId
 * @param {String} userMessage — user's question/request
 * @param {Object} context — { userName, profile, mealPlan, location }
 * @returns {Promise<Object>} — { reply, intent, tokens_used, model_used }
 */
const chat = async (userId, userMessage, context = {}) => {
  const uid = String(userId);
  const intent = _detectIntent(userMessage);

  try {
    // Load conversation history
    const history = _getHistory(uid);

    // Build system prompt
    const systemPrompt = _buildSystemPrompt(context);

    // Construct messages for Groq
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...history,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call Groq with fallover
    const reply = await _callModelWithFallover(messages);

    // Append to history (maintaining max turns)
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: reply });
    _setHistory(uid, history);

    return {
      reply,
      intent,
      tokens_used: Math.ceil(userMessage.length / 4) + Math.ceil(reply.length / 4),
      model_used: MODELS.primary,
    };
  } catch (err) {
    console.error('[Groq Chat Error]', {
      userId: uid,
      intent,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
    });

    throw err;
  }
};

/**
 * clearHistory() — Reset user's conversation history
 */
const clearHistory = (userId) => {
  _clearHistory(String(userId));
  console.log(`[Groq] Cleared history for user ${userId}`);
};

/**
 * getHistoryStats() — Debug info about conversation history
 */
const getHistoryStats = (userId) => {
  const history = _getHistory(String(userId));
  return {
    userId,
    turns: Math.floor(history.length / 2),
    messageCount: history.length,
    sampleMessages: history.slice(-4),
  };
};

module.exports = {
  chat,
  clearHistory,
  getHistoryStats,
};
