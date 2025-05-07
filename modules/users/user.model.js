const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { signToken } = require('../../config/jwt');
const { USER } = require('../../constants/messages');

const deviceSchema = new mongoose.Schema({
  deviceName: { type: String, required: true },
  publicIP: { type: String, required: true },
  passKey: { type: String, required: true },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, USER.NAME_REQUIRED] },
    email: {
      type: String,
      required: [true, USER.EMAIL_REQUIRED],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: USER.INVALID_EMAIL,
      },
    },
    password: {
      type: String,
      required: [true, USER.PASSWORD_REQUIRED],
      minlength: 8,
      select: false,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    otpCreatedAt: Date,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    devices: [deviceSchema],
    folders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  },
  { timestamps: true }
);

userSchema.methods.generateOTP = function () {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otpCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  return otpCode;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateToken = function () {
  return signToken({ _id: this._id, email: this.email });
};

module.exports = mongoose.model('User', userSchema);
