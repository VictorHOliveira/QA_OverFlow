const express = require("express");
const multer = require("multer");
const path = require("path");
const { requireAuth } = require("../middleware/auth");
const { badRequest } = require("../utils/errors");
const { slugify } = require("../utils/slugify");

const ALLOWED_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

function createMediaRouter(mediaService, maxUploadMb) {
  const router = express.Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxUploadMb * 1024 * 1024 },
    fileFilter(req, file, cb) {
      if (!ALLOWED_MIME[file.mimetype]) {
        return cb(badRequest(`Unsupported image type: ${file.mimetype}. Allowed: ${Object.keys(ALLOWED_MIME).join(", ")}`));
      }
      return cb(null, true);
    },
  });

  router.post("/upload", requireAuth, upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw badRequest("Multipart field 'file' is required");
      }
      const ext = path.extname(req.file.originalname || "").toLowerCase() || ALLOWED_MIME[req.file.mimetype];
      const base = slugify(path.basename(req.file.originalname || "image", path.extname(req.file.originalname || ""))) || "image";
      const filename = `${base}-${Date.now()}${ext}`;
      const result = await mediaService.saveImage({ buffer: req.file.buffer, filename });
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMediaRouter };
