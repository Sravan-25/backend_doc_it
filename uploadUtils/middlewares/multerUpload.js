const multer = require('multer');
const {
  imageStorage,
  documentStorage,
  folderStorage,
} = require('../config/storage');
const { imageFilter, documentFilter } = require('../config/filters');
const limits = require('../config/limits');
const handleUpload = require('../handlers/handleUpload');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const singleImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits,
}).single('image');

const multiImages = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits,
}).array('images');

const singleDoc = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits,
}).single('document');

const multiDocs = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits,
}).fields([
  { name: 'document', maxCount: 1 },
  { name: 'document2', maxCount: 1 },
]);

const mixedFiles = multer({
  storage: folderStorage,
  limits,
}).array('files');

const logFields = (req, res, next) => {
  if (req.body || req.files || req.file) {
    logger.info('Received form-data fields', {
      body: Object.keys(req.body),
      files: req.files
        ? Object.keys(req.files)
        : req.file
          ? [req.file.filename]
          : [],
      rawFields: req.headers['content-type']?.includes('multipart')
        ? 'multipart/form-data'
        : 'unknown',
    });
  }
  next();
};

const logFileSave = async (req, res, next) => {
  if (req.file) {
    logger.info('Multer saved file', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: path.resolve(req.file.path),
      destination: path.resolve(req.file.destination),
    });

    try {
      const files = await fs.readdir(req.file.destination);
      logger.info('Directory contents after Multer save', {
        destination: path.resolve(req.file.destination),
        files: files.length ? files : 'empty',
      });
    } catch (error) {
      logger.error('Error reading directory', {
        destination: path.resolve(req.file.destination),
        error: error.message,
      });
    }
  } else if (req.files) {
    const files = Object.values(req.files).flat();
    logger.info('Multer saved multiple files', {
      files: files.map((f) => ({
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        path: path.resolve(f.path),
        destination: path.resolve(f.destination),
      })),
    });
    for (const file of files) {
      try {
        const dirFiles = await fs.readdir(file.destination);
        logger.info('Directory contents after Multer save', {
          destination: path.resolve(file.destination),
          files: dirFiles.length ? dirFiles : 'empty',
        });
      } catch (error) {
        logger.error('Error reading directory', {
          destination: path.resolve(file.destination),
          error: error.message,
        });
      }
    }
  }
  next();
};

module.exports = {
  uploadSingleImage: [logFields, handleUpload(singleImage), logFileSave],
  uploadMultipleImages: [logFields, handleUpload(multiImages), logFileSave],
  uploadSingleDoc: [logFields, handleUpload(singleDoc), logFileSave],
  uploadMultipleDocs: [logFields, handleUpload(multiDocs), logFileSave],
  uploadMixedFiles: [logFields, handleUpload(mixedFiles), logFileSave],
};
