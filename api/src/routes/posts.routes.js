const express = require("express");
const { requireAuth } = require("../middleware/auth");

function createPostsRouter(postsService) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      res.json(await postsService.list(req.query));
    } catch (err) {
      next(err);
    }
  });

  router.get("/:slug", async (req, res, next) => {
    try {
      res.json(await postsService.getOne(req.params.slug));
    } catch (err) {
      next(err);
    }
  });

  router.post("/", requireAuth, async (req, res, next) => {
    try {
      const result = await postsService.create(req.body || {});
      res.status(201).json({
        ...result,
        meta: {
          ...result.meta,
          message: 'Draft created with status "draft". POST /submit-review then POST /publish to make it live.',
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.put("/:slug", requireAuth, async (req, res, next) => {
    try {
      res.json(await postsService.update(req.params.slug, req.body || {}));
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:slug", requireAuth, async (req, res, next) => {
    try {
      res.json(await postsService.remove(req.params.slug));
    } catch (err) {
      next(err);
    }
  });

  router.post("/:slug/submit-review", requireAuth, async (req, res, next) => {
    try {
      const result = await postsService.submitReview(req.params.slug);
      res.json({
        ...result,
        meta: { ...result.meta, message: 'Post moved to "review". Approve via POST /publish.' },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:slug/publish", requireAuth, async (req, res, next) => {
    try {
      const result = await postsService.publish(req.params.slug, req.body || {});
      res.json({
        ...result,
        meta: {
          ...result.meta,
          message: result.meta.committed
            ? "Published and committed to main. GitHub Actions will rebuild and deploy in ~2-3 min."
            : "Published locally. Commit and push to deploy.",
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:slug/unpublish", requireAuth, async (req, res, next) => {
    try {
      const result = await postsService.unpublish(req.params.slug);
      res.json({
        ...result,
        meta: { ...result.meta, message: 'Post returned to "draft" and will disappear from the site on next build.' },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createPostsRouter };
