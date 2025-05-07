const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const documentController = require('./document.controller');
const documentValidators = require('./document.validator');
const validate = require('../../middlewares/validate.middleware');
const {
  uploadSingleDoc,
  uploadMultipleDocs,
} = require('../../uploadUtils/middlewares/multerUpload');

router.get(
  '/',
  authMiddleware,
  validate(documentValidators.getAllDocuments),
  documentController.getAllDocuments
);

router.get(
  '/:id',
  authMiddleware,
  validate(documentValidators.getDocumentById),
  documentController.getDocumentById
);

router.put(
  '/:id',
  authMiddleware,
  uploadMultipleDocs,
  validate(documentValidators.updateDocumentById),
  documentController.updateDocumentById
);

router.delete(
  '/:id',
  authMiddleware,
  validate(documentValidators.deleteDocumentById),
  documentController.deleteDocument
);

router.post(
  '/upload/:folderId',
  authMiddleware,
  uploadSingleDoc,
  validate(documentValidators.uploadSingleDocument),
  documentController.uploadDocument
);

router.get(
  '/download/:id',
  authMiddleware,
  validate(documentValidators.downloadDocumentById),
  documentController.downloadDocument
);

router.post(
  '/upload-multiple/:folderId',
  authMiddleware,
  uploadMultipleDocs,
  validate(documentValidators.uploadMultipleDocuments),
  documentController.uploadMultipleDocuments
);

module.exports = router;
