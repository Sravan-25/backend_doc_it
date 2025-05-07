const User = require('../users/user.model');
const { DEVICE, USER } = require('../../constants/messages');
const ApiError = require('../../utils/apiResponse');
const logger = require('../../utils/logger');

class DeviceService {
  async getDeviceById(userId, deviceId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, USER.NOT_FOUND ?? 'User not found');
      }

      const device = user.devices.find(
        (device) => device._id.toString() === deviceId
      );

      if (!device === -1) {
        throw new ApiError(404, DEVICE.NOT_FOUND ?? 'Device not found');
      }

      return { message: DEVICE.DEVICE_RETRIEVED ?? 'Device found', device };
    } catch (error) {
      logger.error(
        `Get Device By Id Error: ${error.message ?? JSON.stringify(error)}`
      );
      throw new ApiError(
        error.statusCode ?? 500,
        error.message ?? DEVICE.FIND_FAILED ?? 'Failed to retrieve device'
      );
    }
  }

  async addDevice(userId, { deviceName, publicIP, passKey }) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, DEVICE.NOT_FOUND);
      }

      const newDevice = {
        deviceName,
        publicIP,
        passKey,
      };
      user.devices.push(newDevice);
      await user.save();

      return { message: DEVICE.ADDED, device: newDevice };
    } catch (error) {
      logger.error(`Add Device Error: ${error.message}`);
      throw new ApiError(500, DEVICE.ADD_FAILED);
    }
  }

  async getAllDevices() {
    try {
      const users = await User.find().select('name email devices');

      const allDevices = users.flatMap((user) =>
        user.devices.map((device) => ({
          userId: user._id,
          name: user.name,
          email: user.email,
          deviceId: device._id,
          deviceName: device.deviceName,
          publicIP: device.publicIP,
          passKey: device.passKey,
        }))
      );

      return allDevices;
    } catch (error) {
      logger.error(`Get All Devices Error: ${error.message}`);
      throw new ApiError(500, DEVICE.LIST_RETRIEVED);
    }
  }

  async updateDeviceById(userId, deviceId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, DEVICE.NOT_FOUND ?? 'User not found');
      }

      const device = user.devices.find(
        (device) => device._id.toString() === deviceId
      );

      if (!device) {
        throw new ApiError(404, DEVICE.NOT_FOUND ?? 'Device not found');
      }

      Object.assign(device, updateData);
      await user.save();

      return { message: DEVICE.UPDATED ?? 'Device updated', device };
    } catch (error) {
      logger.error(
        `Update Device By Id Error: ${error.message ?? JSON.stringify(error)}`
      );
      throw new ApiError(
        error.statusCode ?? 500,
        error.message ?? DEVICE.UPDATE_FAILED ?? 'Failed to update device'
      );
    }
  }

  async deleteDeviceById(userId, deviceId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, DEVICE.NOT_FOUND ?? 'User not found');
      }

      const deviceIndex = user.devices.findIndex(
        (device) => device._id.toString() === deviceId
      );

      if (deviceIndex === -1) {
        throw new ApiError(404, DEVICE.NOT_FOUND ?? 'Device not found');
      }

      user.devices.splice(deviceIndex, 1);
      await user.save();

      return { message: DEVICE.DELETED ?? 'Device deleted successfully' };
    } catch (error) {
      logger.error(
        `Delete Device By Id Error: ${error.message ?? JSON.stringify(error)}`
      );
      throw new ApiError(
        error.statusCode ?? 500,
        error.message ?? DEVICE.DELETE_FAILED ?? 'Failed to delete device'
      );
    }
  }
}
module.exports = new DeviceService();
