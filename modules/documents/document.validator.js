const { check, param } = require('express-validator');
const { fileSize: MAX_FILE_SIZE } = require('../../uploadUtils/config/limits');
const { documentTypes } = require('../../constants/allowedTypes');
const { getFileExtension } = require('../../helpers/fileHelper');

exports.uploadSingleDocument = [
  check('name').notEmpty().withMessage('Document name is required'),
  param('folderId').optional().isMongoId().withMessage('Invalid folder ID'),
  check('document').custom((_, { req }) => {
    if (!req.file) {
      throw new Error('Document file is required');
    }
    if (req.file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    const fileType = getFileExtension(req.file.originalname).toLowerCase();
    if (!documentTypes.includes(fileType)) {
      throw new Error(
        `Invalid file type. Allowed types: ${documentTypes.join(', ')}`
      );
    }
    return true;
  }),
];

exports.uploadMultipleDocuments = [
  check('name1').notEmpty().withMessage('First document name is required'),
  check('name2').notEmpty().withMessage('Second document name is required'),
  param('folderId').optional().isMongoId().withMessage('Invalid folder ID'),
  check('document').custom((_, { req }) => {
    if (!req.files?.document?.[0]) {
      throw new Error('First document file is required');
    }
    const file = req.files.document[0];
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `First document size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    const fileType = getFileExtension(file.originalname).toLowerCase();
    if (!documentTypes.includes(fileType)) {
      throw new Error(
        `Invalid file type for first document. Allowed types: ${documentTypes.join(', ')}`
      );
    }
    return true;
  }),
  check('document2').custom((_, { req }) => {
    if (!req.files?.document2?.[0]) {
      throw new Error('Second document file is required');
    }
    const file = req.files.document2[0];
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `Second document size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    const fileType = getFileExtension(file.originalname).toLowerCase();
    if (!documentTypes.includes(fileType)) {
      throw new Error(
        `Invalid file type for second document. Allowed types: ${documentTypes.join(', ')}`
      );
    }
    return true;
  }),
];

exports.getAllDocuments = [];

exports.getDocumentById = [
  param('id').isMongoId().withMessage('Invalid document ID'),
];

exports.updateDocumentById = [
  param('id').isMongoId().withMessage('Invalid document ID'),
  check('name1')
    .optional()
    .notEmpty()
    .withMessage('First document name cannot be empty'),
  check('name2').optional(),
  check('folderId').optional().isMongoId().withMessage('Invalid folder ID'),
];

exports.deleteDocumentById = [
  param('id').isMongoId().withMessage('Invalid document ID'),
];

exports.downloadDocumentById = [
  param('id').isMongoId().withMessage('Invalid document ID'),
];
