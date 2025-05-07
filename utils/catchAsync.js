const logger = require('./logger');
const { ApiError } = require('./apiResponse');
const { AppError } = require('./appError');

const catchAsync = (fn, options = {}) => {
  return (req, res, next) => {
    if (res.headersSent) {
      logger.warn('Headers already sent, skipping handler', {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?._id?.toString(),
      });
      return;
    }

    Promise.resolve(fn(req, res, next)).catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err));

      error.requestContext = {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?._id?.toString() || 'unauthenticated',
        timestamp: new Date().toISOString(),
      };

      logger.error('Caught async error', {
        error: {
          message: error.message,
          stack: error.stack,
          statusCode: error.statusCode || 500,
          type: error.name,
        },
        request: error.requestContext,
      });

      if (error instanceof AppError || error instanceof ApiError) {
        return next(error);
      }

      const apiError = new ApiError(
        error.statusCode || 500,
        error.message || 'Internal Server Error',
        error
      );
      next(apiError);
    });
  };
};

module.exports = { catchAsync };
