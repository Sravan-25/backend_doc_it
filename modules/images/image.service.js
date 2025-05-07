const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Image = require('./image.model');
const User = require('../users/user.model');
const Folder = require('../folders/folder.model');
const { IMAGE, FOLDER, USER } = require('../../constants/messages');
const ApiError = require('../../utils/apiResponse');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const fileManager = require('../../uploadUtils/utils/fileManager');
const { Imagetypes } = require('../../constants/allowedTypes');
const { addFolderToArchive } = require('../../utils/download.Utils');
const {
  cleanupFiles,
  getFileExtension,
  validateSingleFileByFolderType,
} = require('../../helpers/fileHelper');

const ImageService = {
  async uploadImage(file, name, folderId, uploadedBy) {
    try {
      if (!file || !file.path) {
        throw new AppError(IMAGE.FILE_REQUIRED, 400);
      }

      if (!name) {
        cleanupFiles([file.filename]);
        throw new AppError(IMAGE.NAME_REQUIRED, 400);
      }

      if (!uploadedBy) {
        cleanupFiles([file.filename]);
        throw new AppError(USER.LOGGED_ERROR, 401);
      }

      let folder = null;
      if (folderId) {
        folder = await Folder.findOne({ _id: folderId, createdBy: uploadedBy });
        if (!folder) {
          cleanupFiles([file.filename]);
          throw new AppError(FOLDER.NOT_FOUND, 404);
        }

        const ext = getFileExtension(file.filename);
        const err = validateSingleFileByFolderType(folder, ext, Imagetypes, []);
        if (err) {
          cleanupFiles([file.filename]);
          throw new AppError(err, 400);
        }
      }

      const relativePath = fileManager.moveFile(file.path, 'images');
      const fileType = getFileExtension(file.filename).toLowerCase();
      const fileSize = file.size;

      const newImage = await Image.create({
        name,
        filePath: relativePath,
        fileType,
        fileSize,
        folderId: folderId || null,
        uploadedBy,
      });

      if (folder) {
        folder.images.push(newImage._id);
        await folder.save();
      }

      logger.info('Image uploaded successfully', {
        name,
        folderId,
        uploadedBy,
        relativePath,
      });

      return newImage;
    } catch (error) {
      logger.error('Error uploading image:', error);
      if (file?.filename) {
        cleanupFiles([file.filename]);
      }
      throw new ApiError(
        error.statusCode || 500,
        error.message || IMAGE.CREATION_FAILED
      );
    }
  },

  async getAllImages(userId) {
    try {
      const images = await Image.find({ uploadedBy: userId })
        .populate('uploadedBy', 'name email')
        .lean();
      return images;
    } catch (error) {
      logger.error('Error fetching images:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || IMAGE.IMAGE_FETCH_FAILED
      );
    }
  },

  async getImageById(imageId, userId) {
    try {
      const image = await Image.findOne({
        _id: imageId,
        uploadedBy: userId,
      })
        .populate('uploadedBy', 'name email')
        .lean();

      if (!image) {
        throw new ApiError(404, IMAGE.IMAGE_NOT_FOUND);
      }

      return image;
    } catch (error) {
      logger.error('Error fetching image:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || IMAGE.IMAGE_FETCH_FAILED
      );
    }
  },

  async deleteImage(imageId, userId) {
    try {
      const image = await Image.findOne({
        _id: imageId,
        uploadedBy: userId,
      });

      if (!image) {
        throw new AppError(IMAGE.IMAGE_NOT_FOUND, 404);
      }

      const baseDir = path.join(__dirname, '../', 'images');
      const filePaths = [];
      if (image.filePath) {
        filePaths.push(path.join(baseDir, path.basename(image.filePath)));
      }
      if (image.filePath2) {
        filePaths.push(path.join(baseDir, path.basename(image.filePath2)));
      }

      filePaths.forEach((filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          logger.warn(`Failed to delete file ${filePath}: ${err.message}`);
        }
      });

      if (image.folderId) {
        await Folder.findByIdAndUpdate(image.folderId, {
          $pull: { images: image._id },
        });
      }

      await Image.findByIdAndDelete(imageId);

      return {
        message: IMAGE.IMAGE_DELETED,
        image,
      };
    } catch (error) {
      logger.error('Error deleting image:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || IMAGE.IMAGE_DELETE_FAILED
      );
    }
  },

  async downloadImage(imageId, userId) {
    try {
      const image = await Image.findOne({
        _id: imageId,
        uploadedBy: userId,
      }).lean();

      if (!image) {
        throw new ApiError(404, IMAGE.IMAGE_NOT_FOUND);
      }

      const archive = await addFolderToArchive(image);
      return archive;
    } catch (error) {
      logger.error('Error downloading image:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || IMAGE.IMAGE_DOWNLOAD_FAILED
      );
    }
  },

  async updateImageById(imageId, userId, body, files) {
    try {
      const { name1, name2 } = body;

      const image = await Image.findOne({
        _id: imageId,
        uploadedBy: userId,
      });

      if (!image) {
        throw new AppError(IMAGE.IMAGE_NOT_FOUND, 404);
      }

      if (name1) image.name = name1;
      if (name2 !== undefined) image.name2 = name2;

      const baseDir = path.join(__dirname, '../', 'images');

      if (files) {
        if (files.image && files.image[0]) {
          const newFile1 = files.image[0];
          if (image.filePath) {
            const oldFilePath1 = path.join(
              baseDir,
              path.basename(image.filePath)
            );
            try {
              if (fs.existsSync(oldFilePath1)) {
                fs.unlinkSync(oldFilePath1);
              }
            } catch (err) {
              logger.warn(
                `Failed to delete old file ${oldFilePath1}: ${err.message}`
              );
            }
          }

          const relativePath = fileManager.moveFile(newFile1.path, 'images');
          image.filePath = relativePath;
          image.fileType = getFileExtension(newFile1.filename).toLowerCase();
          image.fileSize = newFile1.size;
        }

        if (files.image2 && files.image2[0]) {
          const newFile2 = files.image2[0];
          if (image.filePath2) {
            const oldFilePath2 = path.join(
              baseDir,
              path.basename(image.filePath2)
            );
            try {
              if (fs.existsSync(oldFilePath2)) {
                fs.unlinkSync(oldFilePath2);
              }
            } catch (err) {
              logger.warn(
                `Failed to delete old file ${oldFilePath2}: ${err.message}`
              );
            }
          }

          const relativePath = fileManager.moveFile(newFile2.path, 'images');
          image.filePath2 = relativePath;
          image.fileType2 = getFileExtension(newFile2.filename).toLowerCase();
          image.fileSize2 = newFile2.size;
        }
      }

      await image.save();
      return image;
    } catch (error) {
      logger.error('Error updating image:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || IMAGE.IMAGE_UPDATE_FAILED
      );
    }
  },

  async uploadMultipleImages(file1, file2, name1, name2, folderId, uploadedBy) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      if (!file1 || !file2) {
        throw new AppError(IMAGE.UPLOAD_FAILED_IMAGE, 400);
      }

      if (!name1 || !name2) {
        cleanupFiles([file1.filename, file2.filename]);
        throw new AppError(IMAGE.UPLOAD_FAILED_IMAGE, 400);
      }

      if (!uploadedBy) {
        cleanupFiles([file1.filename, file2.filename]);
        throw new AppError(USER.LOGGED_ERROR, 401);
      }

      let folder = null;
      if (folderId) {
        folder = await Folder.findOne({
          _id: folderId,
          createdBy: uploadedBy,
        }).session(session);
        if (!folder) {
          cleanupFiles([file1.filename, file2.filename]);
          throw new AppError(FOLDER.FOLDER_NOT_FOUND, 404);
        }

        const ext1 = getFileExtension(file1.filename);
        const ext2 = getFileExtension(file2.filename);

        const err1 = validateSingleFileByFolderType(
          folder,
          ext1,
          Imagetypes,
          []
        );
        const err2 = validateSingleFileByFolderType(
          folder,
          ext2,
          Imagetypes,
          []
        );

        if (err1 || err2) {
          cleanupFiles([file1.filename, file2.filename]);
          throw new AppError(err1 || err2, 400);
        }
      }

      const uploadType = folderId ? 'images' : 'images';
      const filePath1 = fileManager.moveFile(file1.path, uploadType);
      const filePath2 = fileManager.moveFile(file2.path, uploadType);

      const image = await Image.create(
        [
          {
            name: name1,
            filePath: filePath1,
            fileType: getFileExtension(file1.filename).toLowerCase(),
            fileSize: file1.size,
            name2: name2,
            filePath2: filePath2,
            fileType2: getFileExtension(file2.filename).toLowerCase(),
            fileSize2: file2.size,
            folderId: folderId || null,
            uploadedBy,
            uploadedAt: Date.now(),
          },
        ],
        { session }
      );

      if (folder) {
        folder.images.push(image[0]._id);
        await folder.save({ session });
      }

      await session.commitTransaction();
      return image[0];
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error uploading multiple images:', error);
      cleanupFiles([file1?.filename, file2?.filename].filter(Boolean));
      throw new ApiError(
        error.statusCode || 500,
        error.message || IMAGE.UPLOAD_MULTIPLE_IMAGES_FAILED
      );
    } finally {
      session.endSession();
    }
  },
};

module.exports = ImageService;
