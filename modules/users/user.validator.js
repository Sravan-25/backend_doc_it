const { check } = require('express-validator');

exports.getUser = [check('id').isMongoId().withMessage('Invalid user ID')];

exports.updateUser = [
  check('id').isMongoId().withMessage('Invalid user ID'),
  check('name').optional().notEmpty().withMessage('Name is required'),
  check('email').optional().isEmail().withMessage('Valid email is required'),
];

exports.deleteUser = [check('id').isMongoId().withMessage('Invalid user ID')];
