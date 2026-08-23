const path = require("path");

const env = process.env.NODE_ENV || "development";

const config = {
  env,
  isProd: env === "production",
  isTest: env === "test",
  port: parseInt(process.env.PORT || "3000", 10),
  siteUrl: process.env.SITE_URL || "https://qaoverflow.com",
  apiKey: process.env.API_KEY || (env === "production" ? undefined : "dev-api-key"),
  github: {
    token: process.env.GITHUB_TOKEN || "",
    owner: process.env.GITHUB_OWNER || "VictorHOliveira",
    repo: process.env.GITHUB_REPO || "QA_OverFlow",
    branch: process.env.GITHUB_BRANCH || "main",
    authorName: process.env.GIT_AUTHOR_NAME || "QA OverFlow Bot",
    authorEmail: process.env.GIT_AUTHOR_EMAIL || "bot@qaoverflow.com",
  },
  contentDir: process.env.CONTENT_DIR
    ? path.resolve(process.env.CONTENT_DIR)
    : path.resolve(__dirname, "../../content/posts"),
  imagesDir: process.env.IMAGES_DIR
    ? path.resolve(process.env.IMAGES_DIR)
    : path.resolve(__dirname, "../../images/uploads"),
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || "30000", 10),
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || "5", 10),
  defaultAuthor: process.env.DEFAULT_AUTHOR || "Victor Oliveira",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ||
    "https://qaoverflow.com,https://www.qaoverflow.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

if (config.isProd && !config.apiKey) {
  throw new Error("Missing required env var: API_KEY");
}
if (config.isProd && !config.github.token) {
  throw new Error("Missing required env var: GITHUB_TOKEN");
}

module.exports = config;
