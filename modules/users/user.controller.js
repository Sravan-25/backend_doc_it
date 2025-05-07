const UserService = require('./user.service');
const ApiResponse = require('../../utils/apiResponse');
const { USER } = require('../../constants/messages');
const logger = require('../../utils/logger');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    new ApiResponse(res).success(users, USER.LIST_RETRIEVED);
  } catch (error) {
    logger.error(`Get Users Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    if (!user) {
      return new ApiResponse(res).error(USER.NOT_FOUND, 404);
    }
    new ApiResponse(res).success(user, USER.RETRIEVED);
  } catch (error) {
    logger.error(`Get User Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    new ApiResponse(res).success(user, USER.UPDATED);
  } catch (error) {
    logger.error(`Update User Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await UserService.deleteUser(req.params.id);
    new ApiResponse(res).success(null, USER.DELETED);
  } catch (error) {
    logger.error(`Delete User Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};
