// utils/file.utils.js
const fs = require('fs');
const path = require('path');

exports.ensureDirectoryExists = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

exports.moveFile = (srcPath, destPath) => {
  fs.renameSync(srcPath, destPath);
};

exports.getDiskPath = (userId, pathParts, fileName) => {
  return path.join('uploads', userId.toString(), ...pathParts, fileName);
};

exports.getFileTypeAndModel = (mimetype) => {
  const isImage = mimetype.startsWith('image/');
  const fileType = isImage ? 'images' : 'documents';
  const fileModel = isImage
    ? require('../modules/images/image.model')
    : require('../modules/documents/document.model');
  return { fileType, fileModel };
};
