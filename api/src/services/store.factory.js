const config = require("../config");

function createStore(override) {
  if (override) return override;
  if (config.isProd || config.github.token) {
    const { GithubStore } = require("./stores/github.store");
    return new GithubStore({
      github: config.github,
      siteUrl: config.siteUrl,
      cacheTtlMs: config.cacheTtlMs,
    });
  }
  const { LocalStore } = require("./stores/local.store");
  return new LocalStore({
    contentDir: config.contentDir,
    imagesDir: config.imagesDir,
    siteUrl: config.siteUrl,
  });
}

module.exports = { createStore };
