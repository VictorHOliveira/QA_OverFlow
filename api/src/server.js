require("dotenv").config();
const config = require("./config");
const { createStore } = require("./services/store.factory");
const { createApp } = require("./app");

function main() {
  const store = createStore();
  const app = createApp({ store });

  const server = app.listen(config.port, () => {
    console.log(`[qaoverflow-content-api] listening on :${config.port} (env=${config.env}, store=${store.mode})`);
  });

  const shutdown = (signal) => {
    console.log(`[api] ${signal} received, closing server...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

if (require.main === module) {
  main();
}

module.exports = { main };
