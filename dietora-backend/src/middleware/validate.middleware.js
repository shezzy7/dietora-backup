// src/middleware/validate.middleware.js
// Zod-based request validation middleware

const { z } = require('zod');

/**
 * validate(schema) — wraps a Zod schema into Express middleware
 * Validates req.body; returns 400 on failure
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
    next(error);
  }
};

module.exports = { validate };
