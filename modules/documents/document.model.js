const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String },
    tags: [{ type: String }],
    accessLevel: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    downloads: { type: Number, default: 0 },
    name2: { type: String, trim: true },
    filePath2: { type: String },
    fileType2: { type: String },
    fileSize2: { type: Number },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      index: true,
    },
  },
  { timestamps: true }
);

documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ fileType: 1 });
documentSchema.index({ tags: 1 });

module.exports = mongoose.model('Document', documentSchema);
