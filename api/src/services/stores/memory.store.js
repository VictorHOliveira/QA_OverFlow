class MemoryStore {
  constructor(seed = []) {
    this.mode = "memory";
    this.posts = new Map();
    this.order = [];
    for (const post of seed) {
      this.posts.set(post.slug, { ...post });
      if (!this.order.includes(post.slug)) this.order.push(post.slug);
    }
    this.images = [];
  }

  async list() {
    const known = new Set(this.order);
    const rest = [...this.posts.values()]
      .filter((p) => !known.has(p.slug))
      .sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));
    return [
      ...this.order.map((s) => this.posts.get(s)).filter(Boolean),
      ...rest,
    ];
  }

  async get(slug) {
    const post = this.posts.get(slug);
    return post ? { ...post } : null;
  }

  async upsert(post) {
    const isNew = !this.posts.has(post.slug);
    this.posts.set(post.slug, { ...post });
    if (isNew && !this.order.includes(post.slug)) this.order.push(post.slug);
    return { committed: false, isNew };
  }

  async remove(slug) {
    const removed = this.posts.delete(slug);
    this.order = this.order.filter((s) => s !== slug);
    return { committed: false, removed };
  }

  async saveImage({ buffer, filename }) {
    const year = String(new Date().getFullYear());
    this.images.push(filename);
    return {
      url: `https://qaoverflow.com/images/uploads/${year}/${filename}`,
      path: `images/uploads/${year}/${filename}`,
      committed: false,
    };
  }
}

module.exports = { MemoryStore };
