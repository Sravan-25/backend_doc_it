const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} - ${err.message}`);

  if (process.env.NODE_ENV === 'development') {
    return new ApiResponse(res).error(
      err.message,
      err.statusCode,
      { stack: err.stack }
    );
  }

  new ApiResponse(res).error(err.message, err.statusCode);
};