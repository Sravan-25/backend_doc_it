// utils/folderArchiver.js
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const Folder = require('../modules/folders/folder.model');

exports.addFolderToArchive = async (currentFolder, currentPath = '') => {
  const archive = archiver('zip', { zlib: { level: 9 } });

  const folderPath = path.join(currentPath, currentFolder.name);

  for (const doc of currentFolder.documents) {
    const filePath = path.join(__dirname, '../uploads', doc.filePath);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: path.join(folderPath, doc.name) });
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }

  for (const img of currentFolder.images) {
    const filePath = path.join(__dirname, '../uploads', img.filePath);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: path.join(folderPath, img.name) });
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }

  for (const subfolder of currentFolder.subfolders) {
    const populatedSubfolder = await Folder.findById(subfolder._id)
      .populate('subfolders')
      .populate('documents')
      .populate('images');
    await exports.addFolderToArchive(populatedSubfolder, folderPath); 
  }

  return archive;
};
