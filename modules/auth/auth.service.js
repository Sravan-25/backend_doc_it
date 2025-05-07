const User = require('../users/user.model');
const { sendEmail } = require('../../config/email');
const logger = require('../../utils/logger');
const jwt = require('../../config/jwt');
const { USER } = require('../../constants/messages');

class AuthService {
  async signUp({ name, email, password, confirmPassword }) {
    if (password !== confirmPassword) {
      throw new Error(USER.PASSWORDS_DO_NOT_MATCH || 'Passwords do not match');
    }

    if (await User.findOne({ email })) {
      throw new Error(USER.EMAIL_ALREADY_EXISTS || 'Email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
    });

    const otp = user.generateOTP();
    await user.save();

    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - Doc IT',
        text: `Hello ${name},\n\nThank you for signing up with Doc IT!\n\nYour OTP code is: ${otp}\n\nThis code will expire in 10 minutes.`,
        html: `
          <h2>Hello ${name},</h2>
          <p>Thank you for signing up with Doc IT!</p>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `,
      });
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}: ${error.message}`);
      throw new Error('Failed to send verification email. Please try again later.');
    }

    return {
      success: true,
      message: 'User registered. OTP sent to email.',
      userId: user._id,
      user, 
    };
  }

  async signIn({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error('Invalid Email or Password');
    }
  
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid Email or Password');
    }
  
    const token = jwt.signToken({ userId: user._id, email: user.email });
  
    return {
      token,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }
  

  async verifyOTP(email, code) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    if (!user.otp || user.otp.code !== code) {
      throw new Error('Invalid OTP');
    }

    if (user.otp.expiresAt < new Date()) {
      throw new Error('OTP has expired');
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    console.log('User verified:', user);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async resendOTP(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
  
    if (user.isVerified) {
      throw new Error('Email is already verified');
    }
  
    const otpAge = (new Date() - user.otpCreatedAt) / 1000 / 60;
    if (otpAge < 5) {
      throw new Error('Please wait before requesting a new OTP');
    }
  
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.verificationCode = otp;
    user.otpCreatedAt = new Date();
    await user.save();
  
    try {
      await sendEmail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Resend OTP - Doc IT',
        text: `Hello ${user.name},\n\nYou requested a new OTP code. Your new OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nThe Doc IT Team`,
        html: `
          <h2>Hello ${user.name},</h2>
          <p>You requested a new OTP code.</p>
          <p>Your new OTP code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>Best regards,<br>The Doc IT Team</p>
        `,
      });
    } catch (error) {
      logger.error(`Failed to resend OTP to ${email}: ${error.message}`);
      throw new Error('Failed to send OTP. Please try again later.');
    }
  
    return { success: true, message: 'New OTP sent successfully' };
  }
  
};
module.exports = new AuthService();
