const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Document = require('./document.model');
const User = require('../users/user.model');
const Folder = require('../folders/folder.model');
const { DOCUMENT, FOLDER, USER } = require('../../constants/messages');
const ApiError = require('../../utils/apiResponse');
const logger = require('../../utils/logger');
const AppError = require('../../utils/appError');
const fileManager = require('../../uploadUtils/utils/fileManager');
const { documentTypes, Imagetypes } = require('../../constants/allowedTypes');
const { addFolderToArchive } = require('../../utils/download.Utils');
const {
  cleanupFiles,
  getFileExtension,
  validateFolderFileTypes,
  validateSingleFileByFolderType,
} = require('../../helpers/fileHelper');

class DocumentService {
  async uploadDocument(file, name, folderId, uploadedBy) {
    try {
      if (!file) {
        throw new AppError(DOCUMENT.UPLOAD_FAILED_DOCUMENT, 400);
      }
      if (!name) {
        cleanupFiles([file.filename]);
        throw new AppError(DOCUMENT.UPLOAD_FAILED_NAME, 400);
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
          throw new AppError(FOLDER.FOLDEER_NOT_FOUND, 404);
        }

        const ext = getFileExtension(file.filename);
        const err = validateSingleFileByFolderType(
          folder,
          ext,
          Imagetypes,
          documentTypes
        );

        if (err) {
          cleanupFiles([file.filename]);
          throw new AppError(err, 400);
        }
      }

      const uploadType = folderId ? 'folders' : 'documents';
      const relativePath = fileManager.moveFile(file.path, uploadType);
      const fileType = getFileExtension(file.filename).toLowerCase();
      const fileSize = file.size;

      const doc = await Document.create({
        name,
        filePath: relativePath,
        fileType,
        fileSize,
        folder: folderId || null,
        uploadedBy,
      });

      if (folder) {
        folder.documents.push(doc._id);
        await folder.save();
      }

      return doc;
    } catch (error) {
      logger.error('Error uploading document:', error);
      if (file) {
        cleanupFiles([file.filename]);
      }
      throw new ApiError(
        error.statusCode || 500,
        error.message || DOCUMENT.CREATION_FAILED
      );
    }
  }

  async getAllDocuments(userId) {
    try {
      const documents = await Document.find({ uploadedBy: userId })
        .populate('uploadedBy', 'name email')
        .lean();
      return documents;
    } catch (error) {
      logger.error('Error fetching documents:', error);
      throw new AppError(DOCUMENT.FETCH_FAILED, 500);
    }
  }

  async getDocumentById(documentId, userId) {
    try {
      const document = await Document.findById(documentId)
        .populate('uploadedBy', 'name email')
        .lean();

      if (!document) {
        throw new ApiError(404, DOCUMENT.NOT_FOUND);
      }

      if (document.uploadedBy.toString() !== userId.toString()) {
        throw new ApiError(403, DOCUMENT.NOT_AUTHORIZED);
      }

      return document;
    } catch (error) {
      logger.error('Error fetching document:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || DOCUMENT.FETCH_FAILED
      );
    }
  }

  async deleteDocument(documentId, userId) {
    try {
      const document = await Document.findOne({
        _id: documentId,
        uploadedBy: userId,
      });

      if (!document) {
        throw new AppError(DOCUMENT.NOT_FOUND, 404);
      }

      const filePaths = [];
      if (document.filePath)
        filePaths.push(path.join(__dirname, '../', document.filePath));
      if (document.filePath2)
        filePaths.push(path.join(__dirname, '../', document.filePath2));

      filePaths.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      if (document.folder) {
        await Folder.findByIdAndUpdate(document.folder, {
          $pull: { documents: document._id },
        });
      }

      await Document.findByIdAndDelete(documentId);

      return {
        message: DOCUMENT.DELETED,
        document,
      };
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || DOCUMENT.DELETE_FAILED
      );
    }
  }

  async downloadDocument(documentId, userId) {
    try {
      const document = await Document.findOne({
        _id: documentId,
        uploadedBy: userId,
      }).lean();

      if (!document) {
        throw new ApiError(404, DOCUMENT.NOT_FOUND);
      }

      const archive = await addFolderToArchive(document);
      return archive;
    } catch (error) {
      logger.error('Error downloading document:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || DOCUMENT.DOWNLOAD_FAILED
      );
    }
  }

  async updateDocumentById(documentId, userId, body, files) {
    try {
      const { name1, name2 } = body;

      const document = await Document.findOne({
        _id: documentId,
        uploadedBy: userId,
      });

      if (!document) {
        throw new AppError(DOCUMENT.NOT_FOUND, 404);
      }

      if (name1) document.name = name1;
      if (name2 !== undefined) document.name2 = name2;

      const baseDir = path.join(__dirname, '../', 'folders');

      if (files) {
        if (files.document && files.document[0]) {
          const newFile1 = files.document[0];
          if (document.filePath) {
            const oldFilePath1 = path.join(
              baseDir,
              path.basename(document.filePath)
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

          const uploadType = document.folder ? 'folders' : 'documents';
          document.filePath = fileManager.moveFile(newFile1.path, uploadType);
          document.fileType = getFileExtension(newFile1.filename).toLowerCase();
          document.fileSize = newFile1.size;
        }

        if (files.document2 && files.document2[0]) {
          const newFile2 = files.document2[0];
          if (document.filePath2) {
            const oldFilePath2 = path.join(
              baseDir,
              path.basename(document.filePath2)
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

          const uploadType = document.folder ? 'folders' : 'documents';
          document.filePath2 = fileManager.moveFile(newFile2.path, uploadType);
          document.fileType2 = getFileExtension(
            newFile2.filename
          ).toLowerCase();
          document.fileSize2 = newFile2.size;
        }
      }

      await document.save();
      return document;
    } catch (error) {
      logger.error('Error updating document:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.message || DOCUMENT.UPDATE_FAILED
      );
    }
  }

  async uploadMultipleDocuments(
    file1,
    file2,
    name1,
    name2,
    folderId,
    uploadedBy
  ) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      if (!file1 || !file2) {
        throw new AppError('Both document files are required', 400);
      }

      if (!name1 || !name2) {
        throw new AppError(DOCUMENT.UPLOAD_FAILED_NAME, 400);
      }

      if (!uploadedBy) {
        throw new AppError(USER.LOGGED_ERROR, 401);
      }

      let folder = null;
      if (folderId) {
        folder = await Folder.findOne({
          _id: folderId,
          createdBy: uploadedBy,
        }).session(session);
        if (!folder) {
          throw new AppError(FOLDER.FOLDEER_NOT_FOUND, 404);
        }

        const ext1 = getFileExtension(file1.filename);
        const ext2 = getFileExtension(file2.filename);

        const err1 = validateSingleFileByFolderType(
          folder,
          ext1,
          Imagetypes,
          documentTypes
        );
        const err2 = validateSingleFileByFolderType(
          folder,
          ext2,
          Imagetypes,
          documentTypes
        );

        if (err1 || err2) {
          throw new AppError(err1 || err2, 400);
        }
      }

      const uploadType = folderId ? 'folders' : 'documents';
      const filePath1 = fileManager.moveFile(file1.path, uploadType);
      const filePath2 = fileManager.moveFile(file2.path, uploadType);

      const doc = await Document.create(
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
            folder: folderId || null,
            uploadedBy,
            uploadedAt: Date.now(),
          },
        ],
        { session }
      );

      if (folder) {
        folder.documents.push(doc[0]._id);
        await folder.save({ session });
      }

      await session.commitTransaction();
      return doc[0];
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error uploading multiple documents:', error);
      cleanupFiles([file1?.filename, file2?.filename].filter(Boolean));
      throw new ApiError(
        error.statusCode || 500,
        error.message || DOCUMENT.UPLOAD_MULTIPLE_FAILED
      );
    } finally {
      session.endSession();
    }
  }
}

module.exports = new DocumentService();
