const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads');
const imageDir = path.join(uploadDir, 'images');
const documentDir = path.join(uploadDir, 'documents');
const folderDir = path.join(uploadDir, 'folders');

module.exports = {
  uploadDir,
  imageDir,
  documentDir,
  folderDir,
};
