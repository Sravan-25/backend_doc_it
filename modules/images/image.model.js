const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    name2: { type: String, trim: true },
    filePath: { type: String, required: true },
    filePath2: { type: String },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType2: { type: String },
    fileSize2: { type: Number },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uploadedAt: { type: Date, default: Date.now },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      index: true,
    },
  },
  { timestamps: true }
);

imageSchema.index({ uploadedBy: 1, createdAt: -1 });
imageSchema.index({ fileType: 1 });

module.exports = mongoose.model('Image', imageSchema);
