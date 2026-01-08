const rateLimit = require("express-rate-limit");

const createContactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit each IP to 5 requests per 15 minutes
  message: {
    status: false,
    code: 429,
    message:
      "Too many requests from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = createContactLimiter;