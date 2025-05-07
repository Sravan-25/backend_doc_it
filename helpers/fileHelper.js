const fs = require('fs');
const path = require('path');

const cleanupFiles = (filenames) => {
  filenames.forEach((filename) => {
    if (filename) {
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
};

const getFileExtension = (filename) => {
  return path.extname(filename).slice(1).toLowerCase();
};

const validateFolderFileTypes = (
  folder,
  extensions,
  Imagetypes,
  documentTypes
) => {
  // Placeholder: Implement folder-specific file type validation
  // Example: Check if folder allows specific file types
  return null; // Return error message or null if valid
};

const validateSingleFileByFolderType = (
  folder,
  ext,
  Imagetypes,
  documentTypes
) => {
  // Placeholder: Implement single file type validation based on folder
  if (![...Imagetypes, ...documentTypes].includes(ext)) {
    return `Invalid file type: ${ext}. Allowed types: ${[...Imagetypes, ...documentTypes].join(', ')}`;
  }
  return null; // Return error message or null if valid
};

module.exports = {
  cleanupFiles,
  getFileExtension,
  validateFolderFileTypes,
  validateSingleFileByFolderType,
};
