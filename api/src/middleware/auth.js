const crypto = require("crypto");
const config = require("../config");
const { ApiError } = require("../utils/errors");

function extractApiKey(req) {
  const header = req.get("x-api-key");
  if (header) return header.trim();
  const auth = req.get("authorization");
  if (auth && /^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, "").trim();
  return null;
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAuth(req, res, next) {
  const provided = extractApiKey(req);
  if (!provided) {
    return next(new ApiError(401, "UNAUTHORIZED", "Missing API key. Send it via 'x-api-key' header or 'Authorization: Bearer <key>'."));
  }
  if (!config.apiKey || !timingSafeEqual(provided, config.apiKey)) {
    return next(new ApiError(403, "FORBIDDEN", "Invalid API key"));
  }
  return next();
}

module.exports = { requireAuth };
