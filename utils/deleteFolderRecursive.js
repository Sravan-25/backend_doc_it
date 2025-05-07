const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Folder = require('../modules/folders/folder.model');
// const Document = require('../models/document.model');
// const Image = require('../models/image.model');
const logger = require('./logger');

const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);
const readdirAsync = promisify(fs.readdir);

const deleteFolderRecursive = async (currentFolder, userId) => {
  for (const doc of currentFolder.documents || []) {
    try {
      await unlinkAsync(path.join('uploads', doc.filePath));
      await Document.deleteOne({ _id: doc._id });
    } catch (err) {
      logger.error(`Error deleting document ${doc._id}: ${err.message}`);
    }
  }

  // Delete images
  for (const img of currentFolder.images || []) {
    try {
      await unlinkAsync(path.join('uploads', img.filePath));
      await Image.deleteOne({ _id: img._id });
    } catch (err) {
      logger.error(`Error deleting image ${img._id}: ${err.message}`);
    }
  }

  // Recursively delete subfolders
  for (const subfolder of currentFolder.subfolders || []) {
    const populatedSub = await Folder.findById(subfolder._id)
      .populate('documents')
      .populate('images')
      .populate('subfolders');
    await deleteFolderRecursive(populatedSub, userId);
  }

  // Remove physical folder from disk
  const folderPath = path.join(
    'uploads',
    userId.toString(),
    currentFolder.name
  );
  if (fs.existsSync(folderPath)) {
    const files = await readdirAsync(folderPath);
    await Promise.all(
      files.map((file) => unlinkAsync(path.join(folderPath, file)))
    );
    await rmdirAsync(folderPath);
  }

  // Remove folder from DB
  await Folder.deleteOne({ _id: currentFolder._id });
};

module.exports = deleteFolderRecursive;
