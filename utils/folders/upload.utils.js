const {
  ensureDirectoryExists,
  moveFile,
  getDiskPath,
  getFileTypeAndModel,
} = require('./file.utils');

exports.saveUploadedFileToFolder = async (
  file,
  userId,
  pathParts,
  fileName,
  currentFolder
) => {
  const { fileType, fileModel } = getFileTypeAndModel(file.mimetype);
  const diskPath = getDiskPath(userId, pathParts, fileName);

  ensureDirectoryExists(path.dirname(diskPath));
  moveFile(file.path, diskPath);

  const newFile = new fileModel({
    name: fileName,
    filePath: require('path').relative('uploads', diskPath),
    uploadedBy: userId,
    folder: currentFolder._id,
  });

  await newFile.save();

  currentFolder[fileType].push(newFile._id);
  await currentFolder.save();
};
