const express = require("express");

function createTaxonomyRouter(postsService) {
  const router = express.Router();

  router.get("/categories", async (req, res, next) => {
    try {
      const posts = await postsService.list({ pageSize: 100 });
      const counts = new Map();
      for (const post of posts.data) {
        const key = post.categorySlug || post.category;
        if (!counts.has(key)) {
          counts.set(key, { name: post.category, slug: key, count: 0 });
        }
        counts.get(key).count += 1;
      }
      res.json({
        data: [...counts.values()].sort((a, b) => a.name.localeCompare(b.name)),
        meta: { storeMode: postsService.store.mode },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/tags", async (req, res, next) => {
    try {
      const result = await postsService.list({ pageSize: 100 });
      const counts = new Map();
      for (const post of result.data) {
        for (const tag of post.tags || []) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
      res.json({
        data: [...counts.entries()]
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count),
        meta: { storeMode: postsService.store.mode },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createTaxonomyRouter };
