const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const authController = require('./auth.controller');
const authValidator = require('./auth.validator');

// Middlewares
const validate = require('../../middlewares/validate.middleware');
const verifyMiddleware = require('../../middlewares/verifiled.middleware')();

// Auth Routes
router.post('/signup', validate(authValidator.signUp), authController.signUp);
router.post('/signin', validate(authValidator.signIn), authController.signIn);

router.post(
  '/verify-otp',
  validate(authValidator.verifyOtp),
  authController.verifyOTP
);

router.post('/send-otp', validate(authValidator.sendOtp), authController.sendOTP);

router.post('/logout', authController.logout);

router.get('/protected', verifyMiddleware, (req, res) => {
  res.json({ message: 'You are verified and logged in!' });
});

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallback
);

module.exports = router;
