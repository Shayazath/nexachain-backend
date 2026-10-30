import mongoose from "mongoose";
export function notFound(req, res) {
  res
    .status(404)
    .json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}
export function errorHandler(err, _req, res, _next) {
  if (err?.name === "ZodError")
    return res
      .status(400)
      .json({
        success: false,
        message: "Request validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
  if (err instanceof mongoose.Error.ValidationError)
    return res
      .status(400)
      .json({
        success: false,
        message: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
  if (err?.code === 11000)
    return res
      .status(409)
      .json({
        success: false,
        message: "A record with this value already exists",
      });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res
    .status(status)
    .json({
      success: false,
      message: status >= 500 ? "Internal server error" : err.message,
      ...(err.details ? { details: err.details } : {}),
    });
}
