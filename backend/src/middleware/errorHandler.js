const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal Server Error'
      : message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
