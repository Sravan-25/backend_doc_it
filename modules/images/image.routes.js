const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const imageController = require('./image.controller');
const imageValidators = require('./image.validator');
const validate = require('../../middlewares/validate.middleware');
const {
  uploadSingleImage,
  uploadMultipleImages,
} = require('../../uploadUtils/middlewares/multerUpload');

router.get(
  '/',
  authMiddleware,
  validate(imageValidators.getAllImages),
  imageController.getAllImages
);

router.get(
  '/:id',
  authMiddleware,
  validate(imageValidators.getImageById),
  imageController.getImageById
);

router.put(
  '/:id',
  authMiddleware,
  validate(imageValidators.updateImageById),
  imageController.updateImageById
);

router.delete(
  '/:id',
  authMiddleware,
  validate(imageValidators.deleteImageById),
  imageController.deleteImage
);

router.post(
  '/upload/:id',
  authMiddleware,
  uploadSingleImage,
  validate(imageValidators.uploadSingleImage),
  imageController.uploadImage
);

router.get(
  '/download/:id',
  authMiddleware,
  validate(imageValidators.downloadImageById),
  imageController.downloadImage
);

router.post(
  '/upload-multiple/:id',
  authMiddleware,
  uploadMultipleImages,
  validate(imageValidators.uploadMultipleImages),
  imageController.uploadMultipleImages
);

module.exports = router;
