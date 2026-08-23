const config = require("../config");

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === "entity.too.large" || err.statusCode === 413) {
    return res.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" },
    });
  }
  if (err.name === "MulterError") {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      error: { code: err.code || "UPLOAD_ERROR", message: err.message },
    });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON" },
    });
  }

  if (err.status && err.code) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: formatDetails(err.details) } : {}),
      },
    });
  }

  console.error("[api] Unhandled error:", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: config.isProd ? "Internal server error" : err.message,
    },
  });
}

function formatDetails(ajvErrors) {
  if (!Array.isArray(ajvErrors)) return undefined;
  return ajvErrors.map((e) => ({
    field: (e.instancePath || "") + (e.params && e.params.missingProperty ? `/${e.params.missingProperty}` : ""),
    message: e.message,
  }));
}

module.exports = { notFoundHandler, errorHandler };
