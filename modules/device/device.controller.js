const DeviceService = require('./device.service');
const ApiResponse = require('../../utils/apiResponse');
const { DEVICE } = require('../../constants/messages');
const logger = require('../../utils/logger');

exports.getAllDevices = async (req, res) => {
  try {
    const devices = await DeviceService.getAllDevices();
    new ApiResponse(res).success(devices, DEVICE.LIST_RETRIEVED);
  } catch (error) {
    logger.error(`Get Devices Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.getDeviceById = async (req, res) => {
  try {
    const useId = req.user._id;
    const deviceId = req.params.id;

    const getDevice = await DeviceService.getDeviceById(useId, deviceId);
    if (!getDevice) {
      return new ApiResponse(res).error(DEVICE.NOT_FOUND, 404);
    }
    new ApiResponse(res).success(getDevice, DEVICE.DEVICE_RETRIEVED);
  } catch (error) {
    logger.error(`Get User Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.addDevice = async (req, res) => {
  try {
    const userId = req.user._id;

    if (
      !req.body ||
      !req.body.deviceName ||
      !req.body.publicIP ||
      !req.body.passKey
    ) {
      return new ApiResponse(res).error(
        'All fields (deviceName, publicIP, passKey) are required',
        400
      );
    }

    const { deviceName, publicIP, passKey } = req.body;

    const device = await DeviceService.addDevice(userId, {
      deviceName,
      publicIP,
      passKey,
    });

    new ApiResponse(res).success(device, DEVICE.DEVICE_ADDED);
  } catch (error) {
    logger.error(`Add Device Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const userId = req.user._id;
    const deviceId = req.params.id;
    const updateData = req.body;

    const updatedDevice = await DeviceService.updateDeviceById(
      userId,
      deviceId,
      updateData
    );

    if (!updatedDevice) {
      return new ApiResponse(res).error(
        DEVICE.NOT_FOUND ?? 'Device not found',
        404
      );
    }

    new ApiResponse(res).success(
      updatedDevice,
      DEVICE.DEVICE_UPDATED ?? 'Device updated successfully'
    );
  } catch (error) {
    logger.error(
      `Update Device Error: ${error.message ?? JSON.stringify(error)}`
    );
    const status = error.statusCode || 500;
    new ApiResponse(res).error(error.message ?? 'Something went wrong', status);
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const userId = req.user._id; 
    const deviceId = req.params.id;

    const deletedDevice = await DeviceService.deleteDeviceById(
      userId,
      deviceId
    );
    if (!deletedDevice) {
      return new ApiResponse(res).error(DEVICE.NOT_FOUND, 404);
    }
    new ApiResponse(res).success(deletedDevice, DEVICE.DEVICE_DELETED);
  } catch (error) {
    logger.error(`Delete Device Error: ${error.message}`);
    new ApiResponse(res).error(error.message, error.statusCode || 500);
  }
};
