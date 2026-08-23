/**
 * GLOBAL ERROR HANDLER MIDDLEWARE
 */

function errorHandler(err, req, res, next) {
  console.error('🔥 [ERROR]', err.stack || err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode
    }
  });
}

module.exports = errorHandler;
