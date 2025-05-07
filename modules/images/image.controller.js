const ImageService = require('./image.service');
const ApiResponse = require('../../utils/apiResponse');
const { IMAGE, USER } = require('../../constants/messages');
const logger = require('../../utils/logger');
const folderModel = require('../folders/folder.model');
const catchAsync = require('../../utils/catchAsync');
const {
  cleanupFiles,
  getFileExtension,
  validateFolderFileTypes,
} = require('../../helpers/fileHelper');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return new ApiResponse(res).error('Image file is required', 400);
    }

    const { name } = req.body;
    const { folderId } = req.params;

    if (!name) {
      cleanupFiles([req.file.filename]);
      return new ApiResponse(res).error(IMAGE.UPLOAD_FAILED_IMAGE, 400);
    }

    const uploadedBy = req.user?.id;
    if (!uploadedBy) {
      cleanupFiles([req.file.filename]);
      return new ApiResponse(res).error(USER.LOGGED_ERROR, 401);
    }

    const result = await ImageService.uploadImage(
      req.file,
      name,
      folderId,
      uploadedBy
    );
    return new ApiResponse(res).success(IMAGE.IMAGE_CREATED, result, 201);
  } catch (error) {
    logger.error('Error uploading document:', error);
    if (req.file) {
      cleanupFiles([req.file.filename]);
    }
    return new ApiResponse(res).error(
      error.message || IMAGE.UPLOAD_FAILED_IMAGE,
      error.statusCode || 500
    );
  }
};

exports.getAllImages = async (req, res) => {
  try {
    const userId = req.user._id;
    const images = await ImageService.getAllImages(userId);
    new ApiResponse(res).success(IMAGE.IMAGE_LIST_RETRIEVED, images, 200);
  } catch (error) {
    logger.error('Error fetching images:', error);
    new ApiResponse(500, DOCUMENT.CREATION_FAILED);
  }
};

exports.getImageById = async (req, res) => {
  try {
    const imageId = req.params.id;
    const image = await ImageService.getImageById(imageId);

    if (!image) {
      throw new ApiResponse(404, IMAGE.IMAGE_NOT_FOUND);
    }

    return new ApiResponse(res).success(IMAGE.IMAGE_RETRIEVED, image, 200);
  } catch (error) {
    logger.error('Error fetching image:', error);
    return new ApiResponse(res).error(
      error.message || IMAGE.IMAGE_FETCH_FAILED,
      500
    );
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;

    if (!imageId) {
      throw new ApiResponse(400, IMAGE.INVALID_ID);
    }

    const result = await ImageService.deleteImage(imageId, userId);

    return new ApiResponse(res).success(IMAGE.IMAGE_DELETED, result, 200);
  } catch (error) {
    logger.error('Error deleting image:', error);
    return new ApiResponse(res).error(
      error.message || IMAGE.DELETE_FAILED,
      500
    );
  }
};

exports.downloadImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user._id;

    const file = await ImageService.downloadImage(imageId, userId);

    if (!file) {
      return new ApiResponse(res).error(IMAGE.NOT_FOUND, 404);
    }
    res.attachment(`${imageId}.zip`);
    file.pipe(res);
    file.finalize();
  } catch (error) {
    logger.error('Error downloading image:', error);
    return new ApiResponse(res).error(
      error.message || IMAGE.IMAGE_DOWNLOAD_FAILED,
      500
    );
  }
};

exports.updateImageById = async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;
    const updatedImage = await ImageService.updateImageById(
      imageId,
      userId,
      req.body,
      req.file
    );

    return new ApiResponse(res).success(IMAGE.IMAGE_UPDATED, updatedImage, 200);
  } catch (error) {
    logger.error('Error while updating image:', error);
    return new ApiResponse(res).error(
      error.message || IMAGE.UPDATE_FAILED,
      500
    );
  }
};

exports.uploadMultipleImages = async (body, files, user) => {
  const { name1, name2, folderId } = body;

  if (!files?.image || !files?.image2) {
    throw new Error(IMAGE.UPLOAD_FAILED_IMAGE);
  }

  const image1 = files.image[0];
  const image2 = files.image2[0];

  const uploadedBy = user?._id;
  if (!uploadedBy) {
    throw new Error(USER.LOGGED_ERROR);
  }

  const fileExtension1 = getFileExtension(image1.originalname);
  const fileExtension2 = getFileExtension(image2.originalname);

  let folder = null;

  if (folderId) {
    folder = await folderModel.findOne({
      _id: folderId,
      createdBy: uploadedBy,
    });

    if (!folder) {
      return new ApiResponse(res).error(IMAGE.NOT_FOUND, 404);
    }

    const errorMsg = validateFolderFileTypes(folder.type, [
      fileExtension1,
      fileExtension2,
    ]);

    if (errorMsg) {
      throw {
        code: 400,
        message: errorMsg,
        cleanupFiles: [image1.filename, image2.filename],
      };
    }
  }

  const filePath1 = `/uploads/${image1.filename}`;
  const filePath2 = `/uploads/${image2.filename}`;

  const newImages = new ImageService.Image({
    name: name1 || '',
    filePath: filePath1,
    name2: name2 || '',
    filePath2: filePath2,
    uploadedBy,
    uploadedAt: Date.now(),
  });

  await newImages.save();

  if (folder) {
    folder.images.push(newImages._id);
    await folder.save();
  }

  return { newImages, folder };
};
