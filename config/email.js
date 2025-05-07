const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Doc IT" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email successfully sent to ${options.to}`);
    return true;
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendEmail };  