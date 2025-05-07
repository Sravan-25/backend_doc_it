const { check, param } = require('express-validator');

exports.createFolder = [
  check('name').notEmpty().withMessage('Folder name is required'),
  check('type').notEmpty().withMessage('Folder type is required'),
  check('parentId').optional().isMongoId().withMessage('Invalid parent ID'),
];

exports.getFolders = [];

exports.getFoldersById = [
  check('id').isMongoId().withMessage('Invalid folder ID'),
];

exports.updateFolderById = [
  check('id').isMongoId().withMessage('Invalid folder ID'),
  check('name').optional().notEmpty().withMessage('Folder name is required'),
  check('type').optional().notEmpty().withMessage('Folder type is required'),
];

exports.deleteFolderById = [
  check('id').isMongoId().withMessage('Invalid folder ID'),
];

exports.uploadFolder = [
  param('folderId').isMongoId().withMessage('Invalid folder ID'),
];

exports.downloadFolder = [
  check('id').isMongoId().withMessage('Invalid folder ID'),
];

exports.uploadMulFolders = [
  check('ids').isArray().withMessage('Folder IDs must be an array'),
  check('ids.*').isMongoId().withMessage('Invalid folder ID in array'),
];
