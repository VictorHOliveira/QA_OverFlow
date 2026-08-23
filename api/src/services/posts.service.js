const Ajv = require("ajv");
const config = require("../config");
const { createSchema, updateSchema } = require("../schemas/post.schema");
const { badRequest, notFound, conflict, unprocessable } = require("../utils/errors");
const { slugify } = require("../utils/slugify");
const {
  formatDated,
  computeReadTime,
  todayIsoDate,
  orderFields,
  parsePostDate,
} = require("../utils/derive");

const TRANSITIONS = {
  draft: ["review"],
  review: ["published", "draft"],
  published: ["draft"],
};

class PostsService {
  constructor(store) {
    this.store = store;
    this.ajv = new Ajv({ allErrors: true });
    this.validateCreate = this.ajv.compile(createSchema);
    this.validateUpdate = this.ajv.compile(updateSchema);
  }

  _checkValidation(validator, payload) {
    if (!validator(payload)) {
      throw unprocessable("Payload validation failed", validator.errors);
    }
  }

  async _ensureSlugAvailable(slug) {
    const existing = await this.store.get(slug);
    if (existing) throw conflict(`Post "${slug}" already exists`);
  }

  _deriveFields(post, previous) {
    const derived = { ...post };
    derived.slug = post.slug || previous?.slug || slugify(post.title);
    derived.author = post.author || previous?.author || config.defaultAuthor;
    derived.categorySlug = post.categorySlug || slugify(post.category);
    derived.readTime =
      post.readTime ||
      computeReadTime(
        post.content !== undefined ? post.content : previous?.content || ""
      );
    const dateRef = post.datePublished || previous?.datePublished;
    derived.dated = formatDated(dateRef);
    return derived;
  }

  _validateDates(post) {
    for (const field of ["datePublished", "dateModified"]) {
      if (post[field] && !parsePostDate(post[field])) {
        throw badRequest(`Invalid date in "${field}": ${post[field]}`);
      }
    }
  }

  async list(query = {}) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    let pageSize = parseInt(query.pageSize || "20", 10);
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;
    pageSize = Math.min(pageSize, 100);

    const statuses = query.status
      ? String(query.status).split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    let items = await this.store.list();
    const totalBeforeFilter = items.length;

    items = items.filter((p) => {
      if (statuses && !statuses.includes(p.status)) return false;
      if (query.category && p.categorySlug !== query.category && p.category !== query.category) return false;
      if (query.tag && !(p.tags || []).includes(query.tag)) return false;
      if (query.q) {
        const q = String(query.q).toLowerCase();
        const haystack = `${p.title} ${p.summary} ${p.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sortKey = query.sort === "title" ? "title" : "datePublished";
    const dir = query.order === "asc" ? 1 : -1;
    items.sort((a, b) => {
      const av = sortKey === "title" ? a.title : new Date(a.datePublished || 0);
      const bv = sortKey === "title" ? b.title : new Date(b.datePublished || 0);
      return av < bv ? -dir : av > bv ? dir : 0;
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    const data = items.slice(start, start + pageSize).map((p) =>
      this._toListItem(p)
    );

    return {
      data,
      meta: {
        totalPostsInStore: totalBeforeFilter,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        storeMode: this.store.mode,
      },
    };
  }

  _toListItem(post) {
    const { content, body, ...rest } = post;
    return {
      ...rest,
      url: `${config.siteUrl}/post/${post.slug}/`,
      apiPath: `/api/v1/posts/${post.slug}`,
    };
  }

  async getOne(slug) {
    const post = await this.store.get(slug);
    if (!post) throw notFound(`Post "${slug}" not found`);
    return { data: { ...post, url: `${config.siteUrl}/post/${slug}/` }, meta: { storeMode: this.store.mode } };
  }

  async create(input) {
    this._checkValidation(this.validateCreate, input);
    this._validateDates(input);

    const post = orderFields(
      this._deriveFields({
        ...input,
        slug: input.slug || undefined,
        status: "draft",
        datePublished: input.datePublished || todayIsoDate(),
        dateModified: input.dateModified || todayIsoDate(),
      })
    );
    post.status = "draft";

    await this._ensureSlugAvailable(post.slug);
    const result = await this.store.upsert(post);
    return { data: post, meta: result };
  }

  async update(slug, input) {
    if ("status" in input) {
      throw badRequest(
        'Field "status" cannot be set directly. Use POST /submit-review, /publish or /unpublish endpoints.'
      );
    }
    const existing = await this.store.get(slug);
    if (!existing) throw notFound(`Post "${slug}" not found`);

    this._checkValidation(this.validateUpdate, input);
    this._validateDates(input);

    const merged = { ...existing };
    for (const key of Object.keys(input)) {
      if (key !== "slug") merged[key] = input[key];
    }

    const finalPost = orderFields(
      this._deriveFields(merged, existing)
    );
    finalPost.dateModified = todayIsoDate();
    finalPost.status = existing.status;
    finalPost.slug = slug;

    const result = await this.store.upsert(finalPost);
    return { data: finalPost, meta: result };
  }

  async transition(slug, targetStatus, extra = {}) {
    const existing = await this.store.get(slug);
    if (!existing) throw notFound(`Post "${slug}" not found`);

    const allowed = TRANSITIONS[existing.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw conflict(
        `Invalid transition ${existing.status} -> ${targetStatus}. Allowed from "${existing.status}": [${allowed.join(", ")}]`
      );
    }

    const next = { ...existing, ...extra };
    next.status = targetStatus;
    next.dateModified = todayIsoDate();
    if (targetStatus === "published") {
      next.dated = formatDated(next.datePublished);
    }

    if (targetStatus === "published") {
      this._checkValidation(this.validateCreate, next);
      this._validateDates(next);
    }

    const result = await this.store.upsert(orderFields(next));
    return { data: next, meta: result };
  }

  async submitReview(slug) {
    return this.transition(slug, "review");
  }

  async publish(slug, opts = {}) {
    const extra = {};
    if (opts.datePublished) {
      extra.datePublished = opts.datePublished;
    } else if (opts.setDateToToday) {
      extra.datePublished = todayIsoDate();
    }
    return this.transition(slug, "published", extra);
  }

  async unpublish(slug) {
    return this.transition(slug, "draft");
  }

  async remove(slug) {
    const existing = await this.store.get(slug);
    if (!existing) throw notFound(`Post "${slug}" not found`);
    const result = await this.store.remove(slug);
    return { data: { slug, removed: true }, meta: result };
  }
}

module.exports = { PostsService, TRANSITIONS };
