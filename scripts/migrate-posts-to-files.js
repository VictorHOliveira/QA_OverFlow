const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "_data", "posts.json");
const DEST_DIR = path.join(__dirname, "..", "content", "posts");

const posts = JSON.parse(fs.readFileSync(SRC, "utf-8"));
fs.mkdirSync(DEST_DIR, { recursive: true });

for (const post of posts) {
  const target = path.join(DEST_DIR, `${post.slug}.json`);
  fs.writeFileSync(target, JSON.stringify(post, null, 2) + "\n", "utf-8");
}

fs.writeFileSync(
  path.join(DEST_DIR, "_manifest.json"),
  JSON.stringify(posts.map((p) => p.slug), null, 2) + "\n",
  "utf-8"
);

let ok = 0;
const rereadBySlug = {};
for (const f of fs.readdirSync(DEST_DIR)) {
  if (f === "_manifest.json") continue;
  const parsed = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), "utf-8"));
  rereadBySlug[parsed.slug] = parsed;
}
for (const post of posts) {
  if (
    rereadBySlug[post.slug] &&
    JSON.stringify(rereadBySlug[post.slug]) === JSON.stringify(post)
  ) {
    ok++;
  }
}
const manifestOk =
  JSON.stringify(JSON.parse(fs.readFileSync(path.join(DEST_DIR, "_manifest.json"), "utf-8"))) ===
  JSON.stringify(posts.map((p) => p.slug));
console.log(`Migrated ${posts.length} posts; round-trip OK: ${ok}/${posts.length}; manifest order OK: ${manifestOk}`);
