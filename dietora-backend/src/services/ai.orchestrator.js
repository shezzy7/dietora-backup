// src/services/ai.orchestrator.js
// Advanced AI Orchestration Layer for DIETORA
// Features: Model management, caching, fallover strategies, performance monitoring

const NodeCache = require('node-cache');

// ─── In-memory cache with 30min TTL ────────────────────
const _cache = new NodeCache({ stdTTL: 1800 });

// ─── Model Metadata ───────────────────────────────────────
const MODELS_METADATA = {
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    contextWindow: 32768,
    speed: 'fast',
    costPer1MTok: 0.27,
    maxOutputTokens: 1024,
    bestFor: 'real-time nutrition Q&A',
  },
  'llama2-70b-4096': {
    name: 'Llama 2 70B',
    contextWindow: 4096,
    speed: 'balanced',
    costPer1MTok: 0.7,
    maxOutputTokens: 1024,
    bestFor: 'detailed health advice',
  },
};

// ─── Performance metrics ─────────────────────────────────
const _metrics = {
  requests: 0,
  errors: 0,
  cacheHits: 0,
  averageResponseTime: 0,
  lastResetAt: new Date(),
};

/**
 * queryCache — retrieve cached response
 * Cache key: SHA256(userProfile + message)
 */
const queryCache = (cacheKey) => {
  const cached = _cache.get(cacheKey);
  if (cached) {
    _metrics.cacheHits++;
    console.info(`[AI-Cache] Hit for key: ${cacheKey.substring(0, 20)}...`);
    return cached;
  }
  return null;
};

/**
 * setCache — store response in cache
 */
const setCache = (cacheKey, response, ttlSeconds = 1800) => {
  _cache.set(cacheKey, response, ttlSeconds);
  console.info(`[AI-Cache] Stored key: ${cacheKey.substring(0, 20)}... (TTL: ${ttlSeconds}s)`);
};

/**
 * selectOptimalModel — choose model based on context
 */
const selectOptimalModel = (messageLength, contextLength, userPref = 'speed') => {
  // If user prefers speed or message is short → Mixtral
  if (userPref === 'speed' || messageLength < 500) {
    return MODELS_METADATA['mixtral-8x7b-32768'];
  }

  // If context is large → use model with larger context window
  if (contextLength > 3000) {
    return MODELS_METADATA['mixtral-8x7b-32768']; // 32K context
  }

  // Default to mixtral for best performance
  return MODELS_METADATA['mixtral-8x7b-32768'];
};

/**
 * estimateTokens — rough token count
 * Fair approximation: 1 token ≈ 4 characters
 */
const estimateTokens = (text) => {
  return Math.ceil(text.length / 4);
};

/**
 * recordMetric — track performance
 */
const recordMetric = (type, additionalData = {}) => {
  _metrics.requests++;
  if (type === 'error') {
    _metrics.errors++;
  }
  console.debug(`[AI-Metrics] ${type} recorded`, additionalData);
};

/**
 * getMetrics — performance dashboard data
 */
const getMetrics = () => {
  const cacheHitRate = _metrics.requests > 0 ? 
    (((_metrics.cacheHits / _metrics.requests) * 100).toFixed(2) + '%') : 
    'N/A';

  return {
    ...MODELS_METADATA,
    performance: {
      totalRequests: _metrics.requests,
      totalErrors: _metrics.errors,
      cacheHits: _metrics.cacheHits,
      cacheHitRate,
      errorRate: _metrics.requests > 0 ? 
        (((_metrics.errors / _metrics.requests) * 100).toFixed(2) + '%') : 
        'N/A',
      lastReset: _metrics.lastResetAt,
    },
  };
};

/**
 * clearMetrics — reset performance tracking
 */
const clearMetrics = () => {
  _metrics.requests = 0;
  _metrics.errors = 0;
  _metrics.cacheHits = 0;
  _metrics.lastResetAt = new Date();
  console.info('[AI-Metrics] Metrics reset');
};

/**
 * flushCache — clear all cached responses
 */
const flushCache = () => {
  _cache.flushAll();
  console.info('[AI-Cache] All cached responses flushed');
};

module.exports = {
  MODELS_METADATA,
  queryCache,
  setCache,
  selectOptimalModel,
  estimateTokens,
  recordMetric,
  getMetrics,
  clearMetrics,
  flushCache,
};
