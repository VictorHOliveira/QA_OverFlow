const fs = require("fs");
const path = require("path");

const POSTS_DIR = path.resolve(__dirname, "../../content/posts");
const MANIFEST = path.join(POSTS_DIR, "_manifest.json");

function loadPosts() {
  const bySlug = {};
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith(".json") || file === "_manifest.json") continue;
    const post = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, file), "utf-8"));
    bySlug[post.slug || file.replace(/\.json$/, "")] = post;
  }

  let order = [];
  if (fs.existsSync(MANIFEST)) {
    order = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
  }

  const ordered = order.map((slug) => bySlug[slug]).filter(Boolean);
  const known = new Set(order);
  const unordered = Object.values(bySlug)
    .filter((p) => !known.has(p.slug))
    .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));

  return [...ordered, ...unordered];
}

module.exports = loadPosts();
