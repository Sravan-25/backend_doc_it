const express = require('express');
const router = express.Router();
const deviceController = require('./device.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const deviceValidator = require('./device.validator');
const validate = require('../../middlewares/validate.middleware');

router.get('/', authMiddleware, deviceController.getAllDevices);

router.get(
  '/:id',
  authMiddleware,
  validate(deviceValidator.getDeviceById),
  deviceController.getDeviceById
);

router.post(
  '/add-device',
  authMiddleware,
  validate(deviceValidator.addDevice),
  deviceController.addDevice
);

router.patch(
  '/:id',
  authMiddleware,
  validate(deviceValidator.updateDevice),
  deviceController.updateDevice
);

router.delete(
  '/:id',
  authMiddleware,
  validate(deviceValidator.deleteDevice),
  deviceController.deleteDevice
);

module.exports = router;
