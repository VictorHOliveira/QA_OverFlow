const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const { requireAuth } = require("./middleware/auth");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { createHealthRouter } = require("./routes/health.routes");
const { createPostsRouter } = require("./routes/posts.routes");
const { createMediaRouter } = require("./routes/media.routes");
const { createTaxonomyRouter } = require("./routes/taxonomy.routes");
const { PostsService } = require("./services/posts.service");

function buildLimiter(windowMs, max) {
  if (config.isTest) {
    return (req, res, next) => next();
  }
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests, slow down." } },
  });
}

function createApp({ store } = {}) {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.allowedOrigins.includes("*") || config.allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(null, false);
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  const globalLimiter = buildLimiter(60 * 1000, 300);
  const writeLimiter = buildLimiter(60 * 1000, 60);
  app.use(globalLimiter);

  const postsService = new PostsService(store);
  const mediaService = store;

  app.use("/", createHealthRouter());
  app.use("/api/v1/posts", writeLimiter, createPostsRouter(postsService));
  app.use("/api/v1/taxonomy", createTaxonomyRouter(postsService));
  app.use("/api/v1/media", createMediaRouter(mediaService, config.maxUploadMb));

  if (!config.isProd) {
    app.use("/media/images", express.static(config.imagesDir, { maxAge: "1d" }));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.locals.postsService = postsService;
  return app;
}

module.exports = { createApp };
