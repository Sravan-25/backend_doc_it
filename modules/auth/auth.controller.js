const AuthService = require('./auth.service');
const OTPService = require('../../services/otp.services');
const ApiResponse = require('../../utils/apiResponse');
const { AUTH } = require('../../constants/messages');
const logger = require('../../utils/logger');

exports.signUp = async (req, res) => {
  try {
    const userResponse = await AuthService.signUp(req.body); 

    const user = userResponse.user;

    new ApiResponse(res).success(
      { email: user.email, verified: user.isVerified },
      AUTH.ACCOUNT_CREATED,
      201
    );

    OTPService.sendOTP(user.email).catch((err) =>
      logger.error(`OTP Send Error (post signup): ${err.message}`)
    );
  } catch (error) {
    logger.error(`Signup Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 400);
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await AuthService.verifyOTP(email, code);

    new ApiResponse(res).success(result, 'OTP verified successfully');
  } catch (error) {
    logger.error(`Verify OTP Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 400);
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await OTPService.sendOTP(email);
    new ApiResponse(res).success(result, 'OTP sent successfully');
  } catch (error) {
    logger.error(`Send OTP Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 400);
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await OTPService.resendOTP(email);
    new ApiResponse(res).success(result, 'OTP resent successfully');
  } catch (error) {
    logger.error(`Resend OTP Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 400);
  }
};

exports.signIn = async (req, res) => {
  try {
    const { user, token, message } = await AuthService.signIn(req.body);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, error: 'Please verify your email first' });
    }

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000, 
    });

    res.status(200).json({
      success: true,
      message,
      user,
      token,
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


exports.logout = (req, res) => {
  res.clearCookie('token');
  new ApiResponse(res).success(null, AUTH.LOGOUT_SUCCESS);
};

exports.googleCallback = (req, res) => {
  if (!req.user) {
    return res.redirect('/login?error=authentication_failed');
  }

  req.user.isVerified = true;
  req.user.save();

  const token = generateToken(req.user);
  res.redirect(`/dashboard?token=${token}`);
};
