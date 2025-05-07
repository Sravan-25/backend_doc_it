// config/jwt.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Signs a new JWT token with the provided payload
 * @param {Object} payload
 * @returns {string}
 */
const signToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d', 
    });
  } catch (error) {
    logger.error(`JWT Sign Error: ${error.message}`);
    throw new Error('Token signing failed');
  }
};

/**
 * Verifies and decodes a JWT token
 * @param {string} token 
 * @returns {Object} 
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error(`JWT Verify Error: ${error.message}`);
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  signToken,
  verifyToken,
};
