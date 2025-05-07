const { check } = require('express-validator');

exports.signUp = [
  check('name').notEmpty().withMessage('Name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
    .withMessage(
      'Password must contain at least one uppercase, one lowercase, one number and one special character'
    ),
  check('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

exports.verifyOtp = [
  check('email').isEmail().withMessage('Valid email is required'),
  check('code').notEmpty().withMessage('Verification code is required'),
];

exports.signIn = [
  check('email').isEmail().withMessage('Valid email is required'),
  check('password').notEmpty().withMessage('Password is required'),
];

exports.sendOtp = [
  check('email').isEmail().withMessage('Valid email is required'),
];
