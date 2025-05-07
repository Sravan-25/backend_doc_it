const mongoose = require('mongoose');

const folderSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['documents', 'images', 'folder'],
      default: 'documents',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    subfolders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Folder', folderSchema);
