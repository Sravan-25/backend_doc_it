const { check } = require('express-validator');

exports.addDevice = [
  check('deviceName').notEmpty().withMessage('Device name is required'),
  check('publicIP').notEmpty().withMessage('Public IP is required'),
  check('passKey').notEmpty().withMessage('Pass key is required'),
];

exports.updateDevice = [
  check('deviceName').notEmpty().withMessage('Device name is required'),
  check('publicIP').optional().notEmpty().withMessage('Public IP is required'),
  check('passKey').optional().notEmpty().withMessage('Pass key is required'),
];

exports.getDevice = [
  check('deviceName')
    .optional()
    .notEmpty()
    .withMessage('Device name must not be empty'),
];

exports.deleteDevice = [
  check('id').notEmpty().withMessage('Device ID is required'),
];

exports.getDeviceById = [
  check('id').notEmpty().withMessage('Device ID is required'),
];
