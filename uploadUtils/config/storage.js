const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { imageDir, folderDir } = require('./constants');
const logger = require('../../utils/logger');

const documentDir = path.join(process.cwd(), 'uploads/safe');

[imageDir, documentDir, folderDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.chmodSync(dir, 0o755);
    logger.info('Created directory', { dir });
  }
});

const createStorage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      logger.info('Multer saving file to destination', { destination });
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, extension);
      const cleanName = baseName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      const filename = `${cleanName}${extension}`;
      logger.info('Multer generating filename', {
        originalname: file.originalname,
        sanitized: filename,
      });
      cb(null, filename);
    },
  });

module.exports = {
  imageStorage: createStorage(imageDir),
  documentStorage: createStorage(documentDir),
  folderStorage: createStorage(folderDir),
};
