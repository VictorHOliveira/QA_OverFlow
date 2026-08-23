class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const notFound = (message, details) =>
  new ApiError(404, "NOT_FOUND", message, details);
const conflict = (message, details) =>
  new ApiError(409, "CONFLICT", message, details);
const badRequest = (message, details) =>
  new ApiError(400, "BAD_REQUEST", message, details);
const unprocessable = (message, details) =>
  new ApiError(422, "UNPROCESSABLE", message, details);

module.exports = { ApiError, notFound, conflict, badRequest, unprocessable };
