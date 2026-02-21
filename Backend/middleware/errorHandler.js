/**
 * Centralised error handler middleware.
 * Must be the last app.use() call in server.js.
 */
function errorHandler(err, req, res, next) {
  console.error("[ErrorHandler]", err.message);

  // MySQL duplicate-entry
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "A record with this unique identifier already exists.",
      error: err.sqlMessage,
    });
  }

  // MySQL foreign-key violation
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      success: false,
      message: "Referenced record does not exist.",
      error: err.sqlMessage,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}

export default errorHandler;
