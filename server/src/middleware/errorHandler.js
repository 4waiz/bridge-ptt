function notFound(req, res, _next) {
  return res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
}

function errorHandler(error, _req, res, _next) {
  if (error.code === 'P2002') {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large (max 5MB)' });
  }

  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }

  return res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
