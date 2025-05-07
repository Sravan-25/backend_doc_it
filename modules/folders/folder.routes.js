const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const folderController = require('./folder.controller');
const folderValidator = require('./folder.validator');
const validate = require('../../middlewares/validate.middleware');
const { uploadFilesForFolder } = require("../../services/upload.service");
const {uploadMixedFiles} = require("../../uploadUtils/middlewares/multerUpload");

router.post(
  '/create',
  authMiddleware,
  validate(folderValidator.createFolder),
  folderController.createFolder
);
router.get(
  '/',
  authMiddleware,
  validate(folderValidator.getFolders),
  folderController.getAllFolders
);

router.get(
  '/:id',
  authMiddleware,
  validate(folderValidator.getFoldersById),
  folderController.getFolderById
);

router.put(
  '/:id',
  authMiddleware,
  validate(folderValidator.updateFolderById),
  folderController.updateFolderById
);

router.delete(
  '/:id',
  authMiddleware,
  validate(folderValidator.deleteFolderById),
  folderController.deleteFolderById
);

router.post(
  '/upload/:folderId',  
  authMiddleware,
  validate(folderValidator.uploadFolder),
  uploadMixedFiles,
  folderController.uploadFolder
);

router.get(
  '/download/:id',
  authMiddleware,
  validate(folderValidator.downloadFolder),
  folderController.downloadFolder
);

router.post(
  '/upload-multiple',
  authMiddleware,
  validate(folderValidator.uploadMulFolders),
  uploadMixedFiles,
  folderController.uploadMultipleFolders
);

module.exports = router;
