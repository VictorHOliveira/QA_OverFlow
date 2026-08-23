const { notFound } = require("../../utils/errors");

const POSTS_DIR = "content/posts";
const MANIFEST_PATH = `${POSTS_DIR}/_manifest.json`;

class GithubStore {
  constructor({ github, siteUrl, cacheTtlMs }) {
    const { GithubService } = require("../github.service");
    this.github = new GithubService(github);
    this.siteUrl = siteUrl;
    this.cacheTtlMs = cacheTtlMs;
    this.mode = "github";
    this._cache = null;
  }

  async _loadPosts(force = false) {
    if (!force && this._cache && Date.now() - this._cache.at < this.cacheTtlMs) {
      return this._cache.posts;
    }
    const entries = await this.github.listDir(POSTS_DIR);
    const jsonFiles = entries.filter(
      (e) => e.type === "file" && e.name.endsWith(".json") && e.name !== "_manifest.json"
    );
    const manifest =
      (await this.github.getJsonFile(MANIFEST_PATH)) || [];
    const posts = await Promise.all(
      jsonFiles.map((f) => this.github.getJsonFile(f.path))
    );
    const bySlug = {};
    for (const post of posts) {
      if (post && post.slug) bySlug[post.slug] = post;
    }
    const known = new Set(manifest);
    const ordered = manifest.map((s) => bySlug[s]).filter(Boolean);
    const unordered = Object.values(bySlug)
      .filter((p) => !known.has(p.slug))
      .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));
    this._cache = { at: Date.now(), posts: [...ordered, ...unordered] };
    return this._cache.posts;
  }

  async list() {
    return this._loadPosts();
  }

  async get(slug) {
    const posts = await this._loadPosts();
    return posts.find((p) => p.slug === slug) || null;
  }

  async upsert(post) {
    const existing = await this.get(post.slug);
    const isNew = !existing;
    const manifest = await this.github
      .getJsonFile(MANIFEST_PATH)
      .then((m) => m || []);
    const nextManifest = isNew
      ? [...manifest, post.slug]
      : manifest;

    const commit = await this.github.commitChanges(
      isNew
        ? `feat(content): add draft post "${post.title}"`
        : `chore(content): update post "${post.slug}"`,
      [
        {
          path: `${POSTS_DIR}/${post.slug}.json`,
          content: JSON.stringify(post, null, 2) + "\n",
        },
        ...(nextManifest !== manifest
          ? [{ path: MANIFEST_PATH, content: JSON.stringify(nextManifest, null, 2) + "\n" }]
          : []),
      ]
    );
    await this._loadPosts(true);
    return { committed: true, isNew, commit };
  }

  async remove(slug) {
    const existing = await this.get(slug);
    if (!existing) throw notFound(`Post "${slug}" not found`);
    const manifest = (await this.github.getJsonFile(MANIFEST_PATH)) || [];
    const nextManifest = manifest.filter((s) => s !== slug);
    const commit = await this.github.commitChanges(
      `chore(content): remove post "${slug}"`,
      [
        { path: `${POSTS_DIR}/${slug}.json`, delete: true },
        ...(nextManifest.length !== manifest.length
          ? [{ path: MANIFEST_PATH, content: JSON.stringify(nextManifest, null, 2) + "\n" }]
          : []),
      ]
    );
    await this._loadPosts(true);
    return { committed: true, removed: true, commit };
  }

  async saveImage({ buffer, filename }) {
    const year = String(new Date().getFullYear());
    const pathInRepo = `images/uploads/${year}/${filename}`;
    const commit = await this.github.commitChanges(
      `chore(media): upload image "${filename}"`,
      [
        {
          path: pathInRepo,
          content: buffer.toString("base64"),
          encoding: "base64",
        },
      ]
    );
    return {
      url: `${this.siteUrl}/${pathInRepo}`,
      path: pathInRepo,
      committed: true,
      commit,
    };
  }
}

module.exports = { GithubStore };
