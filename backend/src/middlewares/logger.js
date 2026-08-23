/**
 * HTTP REQUEST LOGGER MIDDLEWARE
 */

function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : '⚡';
    console.log(`[${timestamp}] ${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = requestLogger;
