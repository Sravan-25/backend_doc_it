const User = require('../modules/users/user.model');
const { sendEmail } = require('../config/email');
const logger = require('../utils/logger');

class OTPService {
  async sendOTP(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    if (user.isVerified) {
      throw new Error('Email is already verified');
    }

    const otp = user.generateOTP();
    await user.save();

    await sendEmail({
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Verify Your Email - Doc IT',
      text: `Hello ${user.name},\n\nThank you for signing up with Doc IT! Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nThe Doc IT Team`,
      html: `
        <h2>Hello ${user.name},</h2>
        <p>Thank you for signing up with Doc IT!</p>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>Best regards,<br>The Doc IT Team</p>
      `,
    });

    return { success: true, message: 'OTP sent successfully' };
  }

  async resendOTP(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
  
    if (user.isVerified) {
      throw new Error('Email already verified');
    }
  
    const otpAge = (new Date() - user.otpCreatedAt) / 1000 / 60;
    if (otpAge < 5) {
      throw new Error('Please wait before requesting a new OTP');
    }
  
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = otp;
    user.otpCreatedAt = new Date();
    await user.save();
  
    try {
      await sendEmail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'New OTP Code - Doc IT',
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
  
    return {
      success: true,
      message: 'New OTP sent successfully',
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

    return { success: true, message: 'OTP verified successfully' };
  }
  
}

module.exports = new OTPService();
