const User = require('./user.model');
const { USER } = require('../../constants/messages');
const ApiError = require('../../utils/apiResponse');
const logger = require('../../utils/logger');

class UserService {
  async getAllUsers() {
    try {
      return await User.find()
        .populate({
          path: 'folders',
          populate: [
            { path: 'images', select: 'name filePath name2 filePath2' },
            { path: 'documents', select: 'name filePath name2 filePath2' },
          ],
        })
        .select('-password');
    } catch (error) {
      logger.error(`Get All Users Error: ${error.message}`);
      throw new ApiError(500, 'USER.LIST_ERROR');
    }
  }

  async getUserById(id) {
    try {
      return await User.findById(id)
        .populate({
          path: 'folders',
          populate: [
            { path: 'images', select: 'name filePath name2 filePath2' },
            { path: 'documents', select: 'name filePath name2 filePath2' },
          ],
        })
        .select('-password');
    } catch (error) {
      logger.error(`Get User Error: ${error.message}`);
      throw new ApiError(404, USER.NOT_FOUND);
    }
  }

  async updateUser(id, updateData) {
    try {
      delete updateData.password;
      delete updateData.createdAt;

      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) {
        throw new ApiError(404, USER.NOT_FOUND);
      }

      return user;
    } catch (error) {
      logger.error(`Update User Error: ${error.message}`);
      throw new ApiError(500, USER.UPDATE_ERROR);
    }
  }

  async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        throw new ApiError(404, USER.NOT_FOUND);
      }
    } catch (error) {
      logger.error(`Delete User Error: ${error.message}`);
      throw new ApiError(500, USER.DELETE_ERROR);
    }
  }
}

module.exports = new UserService();
