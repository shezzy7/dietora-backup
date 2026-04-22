// src/services/gemini.service.js
// Model: gemini-1.5-flash-001  (pinned stable version — confirmed on v1beta endpoint)
//
// Why this exact name:
//   gemini-2.0-flash      → free quota exhausted (429)
//   gemini-1.5-flash      → alias removed from v1beta (404)
//   gemini-1.5-flash-8b   → alias removed from v1beta (404)
//   gemini-1.5-flash-001  → ✅ pinned stable, free tier, works on SDK 0.21.x v1beta
//
// Free tier limits: 15 RPM, 1500 RPD, 1M TPM — no billing required.

const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL = 'gemini-2.5-flash';

// ─── Client (lazy init) ───────────────────────────────────
let _genAI = null;
const getClient = () => {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing from .env');
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
};

// ─── Retry with exponential backoff ──────────────────────
// Handles 429 quota and 503 server errors gracefully.
const withRetry = async (fn, retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.status === 429 || err?.message?.includes('429');
      const is503 = err?.status === 503 || err?.message?.includes('503');
      if ((is429 || is503) && attempt < retries) {
        const wait = delayMs * attempt;
        console.warn(`[Gemini] ${err.status} — retrying in ${wait}ms (${attempt}/${retries})`);
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
};

// ─── Per-user conversation history (in-memory) ────────────
const _historyStore = new Map();
const MAX_TURNS = 10;
const _getHistory = (uid) => _historyStore.get(String(uid)) || [];
const _setHistory = (uid, h) => _historyStore.set(String(uid), h.slice(-MAX_TURNS * 2));
const _clearHistory = (uid) => _historyStore.delete(String(uid));

// ─── System prompt builder ────────────────────────────────
const _buildSystemPrompt = ({ profile, mealPlan, location, userName }) => {
  const lines = [
    'You are DIETORA AI, a professional nutrition and diet assistant for Pakistani users.',
    'Expertise: Pakistani food culture, diabetes, hypertension, cardiac diets, weight management, budget eating.',
    'Tone: warm, professional, concise. Use Pakistani food terms naturally (roti, dal, sabzi, karahi, etc.).',
    'Language: match the user — English or Roman Urdu.',
    '',
    '=== USER CONTEXT ===',
  ];

  lines.push(`Name: ${userName || 'Unknown'}`);

  if (profile) {
    lines.push(
      `Age: ${profile.age}y | Gender: ${profile.gender} | Weight: ${profile.weight}kg | Height: ${profile.height}cm`,
      `BMI: ${profile.bmi} (${profile.bmiCategory}) | BMR: ${profile.bmr} kcal | TDEE: ${profile.tdee} kcal`,
      `Daily Calorie Target: ${profile.dailyCalorieTarget} kcal | Goal: ${profile.goal?.replace(/_/g, ' ')}`,
      `Activity: ${profile.activityLevel?.replace(/_/g, ' ')} | Budget: PKR ${profile.dailyBudget}/day`,
      `Conditions: ${[profile.isDiabetic && 'Diabetes', profile.isHypertensive && 'Hypertension', profile.isCardiac && 'Cardiac'].filter(Boolean).join(', ') || 'None'}`,
      `Allergies: ${profile.allergies?.length ? profile.allergies.join(', ') : 'None'}`,
    );
  } else {
    lines.push('Health profile: NOT SET. Encourage the user to create their profile at the Profile page.');
  }

  if (mealPlan) {
    lines.push(
      '', '=== ACTIVE MEAL PLAN ===',
      `${mealPlan.title} | Status: ${mealPlan.status}`,
      `Calorie target: ${mealPlan.planConfig?.dailyCalorieTarget} kcal/day | Budget: PKR ${mealPlan.planConfig?.dailyBudget}/day`,
      `Avg daily cost: PKR ${mealPlan.avgDailyCost} | Weekly cost: PKR ${mealPlan.weeklyTotalCost}`,
    );
  } else {
    lines.push('', 'Meal plan: None active. Suggest they generate one on the Meal Plan page.');
  }

  if (location?.locationConsent && location?.currentLocation?.coordinates) {
    const [lon, lat] = location.currentLocation.coordinates;
    lines.push(
      '', '=== LOCATION ===',
      `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)} | Area: ${location.resolvedArea || 'N/A'}, ${location.resolvedCity || 'N/A'}`,
    );
  } else if (location?.manualCity) {
    lines.push('', '=== LOCATION ===', `City: ${location.manualCity} (manual)`);
  } else {
    lines.push('', '=== LOCATION ===', 'Not available. Tell user to enable location in Settings if they ask about nearby stores.');
  }

  lines.push(
    '', '=== RULES ===',
    '- Always personalize advice using the health data above.',
    '- Never fabricate store names.',
    '- For diabetics: flag high-glycemic foods. For hypertension: mention sodium. For cardiac: mention saturated fat.',
    '- Responses: concise, actionable, under 300 words unless complex topic.',
    '- Format with markdown: bold key terms, use bullet lists.',
    '- When store data is injected in [STORES] block, present it clearly with names and directions links.',
  );

  return lines.join('\n');
};

// ─── Store-search intent detection ───────────────────────
const _STORE_PATTERNS = [
  /where\s*(can\s*i|to|do\s*i)?\s*(buy|get|find|purchase)/i,
  /kahan\s*(se|milega|milta|milti|mil|sey)/i,
  /nearby\s*(store|shop|mart|grocery)/i,
  /(store|mart|dukan|kiryana)\s*(near|nearby|qareeb)/i,
  /koi\s*(dukan|store|shop|mart)/i,
];
const _needsStoreSearch = (msg) => _STORE_PATTERNS.some((p) => p.test(msg));

// ─── Food keyword extraction ──────────────────────────────
const _FOOD_MAP = {
  chicken: 'meat', murgh: 'meat', beef: 'meat', gosht: 'meat', mutton: 'meat',
  fish: 'meat', machli: 'meat', qeema: 'meat',
  sabzi: 'vegetables', bhindi: 'vegetables', aloo: 'vegetables',
  palak: 'vegetables', saag: 'vegetables', tamatar: 'vegetables',
  karela: 'vegetables', gobi: 'vegetables',
  dahi: 'dairy', yogurt: 'dairy', milk: 'dairy', doodh: 'dairy', paneer: 'dairy',
  dal: 'lentils', daal: 'lentils', masoor: 'lentils', chana: 'lentils', moong: 'lentils',
  chawal: 'rice', rice: 'rice', basmati: 'rice',
  roti: 'bread', naan: 'bread', atta: 'bread',
  fruit: 'fruits', phal: 'fruits', banana: 'fruits', mango: 'fruits',
};
const _extractFood = (msg) => {
  const lower = msg.toLowerCase();
  for (const [kw, cat] of Object.entries(_FOOD_MAP)) {
    if (lower.includes(kw)) return { foodName: kw, category: cat };
  }
  return { foodName: null, category: 'grocery' };
};

// ─── Store context formatter ──────────────────────────────
const _buildStoreContext = (storeData) => {
  if (!storeData?.stores?.length) return '';
  const { stores, foodName } = storeData;
  const list = stores.slice(0, 5).map((s, i) =>
    `${i + 1}. ${s.name}\n   Address: ${s.address}\n   Distance: ${s.distanceText || 'N/A'} | Rating: ${s.rating ? s.rating.toFixed(1) : 'N/A'}/5\n   Status: ${s.isOpenNow === true ? 'Open now' : s.isOpenNow === false ? 'Closed' : 'Unknown'}\n   Directions: ${s.directionsLink}`
  ).join('\n\n');
  return `\n\n[STORES]\n${foodName ? `Nearby places to buy "${foodName}":` : 'Nearby grocery stores:'}\n\n${list}\n[/STORES]`;
};

// ─── Store fetcher ────────────────────────────────────────
const _fetchStores = async (message, userLocation) => {
  if (!userLocation?.locationConsent || !userLocation?.currentLocation?.coordinates) return null;
  let placesService;
  try { placesService = require('./places.service'); } catch { return null; }
  const [lon, lat] = userLocation.currentLocation.coordinates;
  const { foodName, category } = _extractFood(message);
  try {
    let rawStores;
    if (foodName) {
      rawStores = await placesService.searchStoresForFood(category, foodName, lat, lon, 5000);
    } else {
      rawStores = await placesService.searchNearbyStores(lat, lon, 3000, 'grocery store supermarket kiryana');
      rawStores = rawStores.slice(0, 8);
    }
    return { stores: placesService.attachDistances(rawStores, lat, lon), foodName };
  } catch (err) {
    console.warn('[DIETORA] Store search skipped:', err.message);
    return null;
  }
};

// ─── Main chat function ───────────────────────────────────
const chat = async (userId, message, userContext = {}) => {
  // 1. Optional store search (non-fatal)
  let storeData = null;
  let storeContext = '';
  if (_needsStoreSearch(message)) {
    storeData = await _fetchStores(message, userContext.location).catch(() => null);
    storeContext = _buildStoreContext(storeData);
  }

  // 2. Build inputs
  const systemText = _buildSystemPrompt(userContext);
  const userMessage = storeContext ? `${message}${storeContext}` : message;
  const existingHistory = _getHistory(userId);

  // 3. Call Gemini with automatic retry
  const replyText = await withRetry(async () => {
    const model = getClient().getGenerativeModel({
      model: MODEL,
      systemInstruction: systemText,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });
    const session = model.startChat({ history: existingHistory });
    const result = await session.sendMessage(userMessage);
    return result.response.text();
  });

  // 4. Persist history
  _setHistory(userId, [
    ...existingHistory,
    { role: 'user', parts: [{ text: message }] },
    { role: 'model', parts: [{ text: replyText }] },
  ]);

  // 5. Return
  return {
    reply: replyText,
    stores: storeData?.stores?.slice(0, 5).map((s) => ({
      placeId: s.placeId,
      name: s.name,
      address: s.address,
      rating: s.rating,
      totalRatings: s.totalRatings,
      isOpenNow: s.isOpenNow,
      distanceKm: s.distanceKm,
      distanceText: s.distanceText,
      mapsLink: s.mapsLink,
      directionsLink: s.directionsLink,
      coordinates: s.coordinates,
    })) || [],
    hasStoreResults: !!storeData?.stores?.length,
    foodSearched: storeData?.foodName || null,
    intent: storeData ? 'store_search' : 'general',
  };
};

const clearConversation = (uid) => _clearHistory(uid);

module.exports = { chat, clearConversation };
