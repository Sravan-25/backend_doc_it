const mongoose = require('mongoose');
const { verifyToken } = require('../config/jwt');
const User = require('../modules/users/user.model');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new ApiResponse(res).error('Please authenticate', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return new ApiResponse(res).error('Invalid or expired token', 401);
    }

    const currentUser = await User.findById(decoded.userId);

    if (!currentUser) {
      return new ApiResponse(res).error('User no longer exists', 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    logger.error(`Auth Middleware Error: ${error.message}`);
    return new ApiResponse(res).error('Please authenticate', 401);
  }
};
