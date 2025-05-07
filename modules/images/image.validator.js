const { check, param } = require('express-validator');
const { fileSize: MAX_FILE_SIZE } = require('../../uploadUtils/config/limits');
const { imageTypes } = require('../../constants/allowedTypes');
const { getFileExtension } = require('../../helpers/fileHelper');

exports.uploadSingleImage = [
  check('name').notEmpty().withMessage('Image name is required'),
  param('id').optional().isMongoId().withMessage('Invalid folder ID'),
  check('image').custom((_, { req }) => {
    if (!req.file) {
      throw new Error('Image file is required');
    }
    if (req.file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    const fileType = getFileExtension(req.file.originalname).toLowerCase();
    if (!imageTypes.includes(fileType)) {
      throw new Error(
        `Invalid file type. Allowed types: ${imageTypes.join(', ')}`
      );
    }
    return true;
  }),
];

exports.uploadMultipleImages = [
  check('name1').notEmpty().withMessage('First image name is required'),
  check('name2').notEmpty().withMessage('Second image name is required'),
  param('id').optional().isMongoId().withMessage('Invalid folder ID'),
  check('image').custom((_, { req }) => {
    if (!req.files?.image?.[0]) {
      throw new Error('First image file is required');
    }
    const file = req.files.image[0];
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `First image size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    const fileType = getFileExtension(file.originalname).toLowerCase();
    if (!imageTypes.includes(fileType)) {
      throw new Error(
        `Invalid file type for first image. Allowed types: ${Imagetypes.join(', ')}`
      );
    }
    return true;
  }),
  check('image2').custom((_, { req }) => {
    if (!req.files?.image2?.[0]) {
      throw new Error('Second image file is required');
    }
    const file = req.files.image2[0];
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `Second image size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    const fileType = getFileExtension(file.originalname).toLowerCase();
    if (!imageTypes.includes(fileType)) {
      throw new Error(
        `Invalid file type for second image. Allowed types: ${Imagetypes.join(', ')}`
      );
    }
    return true;
  }),
];

exports.getAllImages = [];

exports.getImageById = [
  check('id').isMongoId().withMessage('Invalid image ID'),
];

exports.updateImageById = [
  check('id').isMongoId().withMessage('Invalid image ID'),
  check('name1')
    .optional()
    .notEmpty()
    .withMessage('First image name cannot be empty'),
  check('name2').optional(),
  param('id').optional().isMongoId().withMessage('Invalid folder ID'),
];

exports.deleteImageById = [
  check('id').isMongoId().withMessage('Invalid image ID'),
];

exports.downloadImageById = [
  check('id').isMongoId().withMessage('Invalid image ID'),
];
