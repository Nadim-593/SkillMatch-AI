const notFound = (req, res, next) => {
  const err = new Error(`Resource not found — ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = notFound;
