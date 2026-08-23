const fs = require("fs");
const path = require("path");

class LocalStore {
  constructor({ contentDir, imagesDir, siteUrl }) {
    this.contentDir = contentDir;
    this.imagesDir = imagesDir;
    this.siteUrl = siteUrl;
    this.mode = "local";
    this.manifestPath = path.join(contentDir, "_manifest.json");
  }

  _readManifest() {
    if (!fs.existsSync(this.manifestPath)) return [];
    return JSON.parse(fs.readFileSync(this.manifestPath, "utf-8"));
  }

  _writeManifest(slugs) {
    fs.writeFileSync(
      this.manifestPath,
      JSON.stringify(slugs, null, 2) + "\n",
      "utf-8"
    );
  }

  async list() {
    const bySlug = {};
    for (const file of fs.readdirSync(this.contentDir)) {
      if (!file.endsWith(".json") || file === "_manifest.json") continue;
      const post = JSON.parse(fs.readFileSync(path.join(this.contentDir, file), "utf-8"));
      bySlug[post.slug || file.replace(/\.json$/, "")] = post;
    }
    const order = this._readManifest();
    const ordered = order.map((s) => bySlug[s]).filter(Boolean);
    const known = new Set(order);
    const unordered = Object.values(bySlug)
      .filter((p) => !known.has(p.slug))
      .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));
    return [...ordered, ...unordered];
  }

  async get(slug) {
    const filePath = path.join(this.contentDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  async upsert(post) {
    const isNew = (await this.get(post.slug)) === null;
    fs.writeFileSync(
      path.join(this.contentDir, `${post.slug}.json`),
      JSON.stringify(post, null, 2) + "\n",
      "utf-8"
    );
    const slugs = this._readManifest();
    if (!slugs.includes(post.slug)) {
      slugs.push(post.slug);
      this._writeManifest(slugs);
    }
    return { committed: false, isNew };
  }

  async remove(slug) {
    const filePath = path.join(this.contentDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) return { committed: false, removed: false };
    fs.unlinkSync(filePath);
    this._writeManifest(this._readManifest().filter((s) => s !== slug));
    return { committed: false, removed: true };
  }

  async saveImage({ buffer, filename }) {
    const year = String(new Date().getFullYear());
    const dir = path.join(this.imagesDir, year);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    return {
      url: `${this.siteUrl}/images/uploads/${year}/${filename}`,
      path: `images/uploads/${year}/${filename}`,
      committed: false,
    };
  }
}

module.exports = { LocalStore };
