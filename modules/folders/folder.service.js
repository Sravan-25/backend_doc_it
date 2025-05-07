const Folder = require('./folder.model');
const User = require('../users/user.model');
const Document = require('../documents/document.model');
const Image = require('../images/image.model');
const { FOLDER, USER } = require('../../constants/messages');
const ApiError = require('../../utils/apiResponse');
const logger = require('../../utils/logger');
const deleteFolderRecursive = require('../../utils/deleteFolderRecursive');
const { addFolderToArchive } = require('../../utils/download.Utils');
const { getOrCreateNestedFolder } = require('../../utils/folders/folder.utils');
const {
  saveUploadedFileToFolder,
} = require('../../utils/folders/upload.utils');

class UserService {
  async createFolder({ name, type, parentId, userId }) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, USER.NOT_FOUND);
      }

      if (!name) {
        throw new ApiError(404, FOLDER.NAME_REQUIRED);
      }

      if (type && !['documents', 'images'].includes(type)) {
        throw new ApiError(404, FOLDER.TYPE_INVALID);
      }

      let parentFolder = null;
      if (parentId) {
        parentFolder = await Folder.findOne({
          _id: parentId,
          createdBy: userId,
        });
        if (!parentFolder) {
          throw new ApiError(404, FOLDER.PARENT_FOLDER_NOT_FOUND);
        }
      }

      const newFolder = new Folder({
        name,
        type: type || 'documents',
        createdBy: userId,
        parentId: parentId || null,
        subfolders: [],
        documents: [],
        images: [],
      });

      await newFolder.save();

      if (parentId && parentFolder) {
        parentFolder.subfolders.push(newFolder._id);
        await parentFolder.save();
      } else {
        await User.findByIdAndUpdate(userId, {
          $push: { folders: newFolder._id },
        });
      }

      return newFolder;
    } catch (error) {
      logger.error(`Error creating folder:, ${error.message}`);
      throw new ApiError(500, FOLDER.CREATION_FAILED);
    }
  }

  async getAllFolders(userId) {
    try {
      const folders = await Folder.find({ parentId: null, createdBy: userId })
        .populate('createdBy', 'name email')
        .populate('subfolders')
        .populate('documents')
        .populate('images')
        .sort({ createdAt: -1 });
      return folders;
    } catch (error) {
      logger.error(`Error getting folders: ${error.message}`);
      throw new ApiError(500, FOLDER.FETCH_FAILED);
    }
  }

  async getFolderById(folderId, userId) {
    try {
      const folder = await Folder.findOne({
        _id: folderId,
        createdBy: userId,
      })
        .populate('createdBy', 'name email')
        .populate('subfolders')
        .populate('documents', 'name filePath name2 filePath2')
        .populate('images', 'name filePath name2 filePath2');

      if (!folder) {
        throw new ApiError(404, FOLDER.NOT_FOUND);
      }

      return folder;
    } catch (error) {
      logger.error(`Error getting folder by ID: ${error.message}`);
      throw new ApiError(500, FOLDER.FETCH_FAILED);
    }
  }

  async updateFolderById(folderId, userId, { name, type }) {
    try {
      if (!folderId || folderId === 'undefined') {
        throw new ApiError(400, FOLDER.INVALID_ID);
      }

      if (name && (typeof name !== 'string' || name.trim() === '')) {
        throw new ApiError(400, FOLDER.NAME_INVALID);
      }

      const folder = await Folder.findOne({ _id: folderId, createdBy: userId });

      if (!folder) {
        throw new ApiError(404, FOLDER.NOT_FOUND);
      }

      if (name) folder.name = name.trim();
      if (type && ['documents', 'images'].includes(type)) {
        folder.type = type;
      }

      await folder.save();
      return folder;
    } catch (error) {
      const status = error instanceof ApiError ? error.statusCode : 500;
      const message =
        error instanceof ApiError ? error.message : FOLDER.UPDATE_FAILED;

      logger.error(`Error updating folder by ID: ${message}`);
      throw new ApiError(status, message);
    }
  }

  async deleteFolderById(folderId, userId) {
    try {
      if (!folderId || folderId === 'undefined') {
        throw new ApiError(400, FOLDER.INVALID_ID);
      }

      const folder = await Folder.findOne({ _id: folderId, createdBy: userId })
        .populate('documents')
        .populate('images')
        .populate('subfolders');

      if (!folder) {
        throw new ApiError(404, FOLDER.NOT_FOUND);
      }

      await deleteFolderRecursive(folder, userId);

      if (folder.parentId) {
        await Folder.findByIdAndUpdate(folder.parentId, {
          $pull: { subfolders: folderId },
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          $pull: { folders: folderId },
        });
      }

      return folder;
    } catch (error) {
      logger.error(`Error deleting folder by ID: ${error?.message || error}`);
      throw new ApiError(500, FOLDER.DELETE_ERROR);
    }
  }

  async uploadFolder(folderId, userId, files) {
    try {
      const folder = await Folder.findOne({ _id: folderId, createdBy: userId });
      if (!folder) {
        throw new ApiError(404, FOLDER.FOLDEER_NOT_FOUND);
      }

      const processedFiles = [];
      for (const file of files) {
        const model = folder.type === 'documents' ? Document : Image;
        const docOrImg = new model({
          name: file.originalname,
          filePath: file.filename || file.originalname,
          uploadedBy: userId,
        });
        await docOrImg.save();

        if (folder.type === 'documents') {
          folder.documents.push(docOrImg._id);
        } else {
          folder.images.push(docOrImg._id);
        }

        processedFiles.push({
          filename: file.originalname,
          id: docOrImg._id,
          status: 'success',
        });
      }

      await folder.save();

      return processedFiles;
    } catch (error) {
      throw new Error(`Error uploading files: ${error.message}`);
    }
  }

  async downloadFolderContent(folderId, userId, res) {
    try {
      const folder = await Folder.findOne({ _id: folderId, createdBy: userId })
        .populate('subfolders')
        .populate('documents')
        .populate('images');

      if (!folder) {
        throw new Error('Folder not found or unauthorized');
      }

      const archive = await addFolderToArchive(folder);
      return archive;
    } catch (error) {
      throw new Error(`Error downloading folder: ${error.message}`);
    }
  }

  async uploadMultipleFolders(userId, files, parentId) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const firstFilePath =
      files[0].originalname || files[0].webkitRelativePath || '';
    const rootFolderName = firstFilePath.split('/')[0] || 'UploadedFolder';

    const rootFolder = new Folder({
      name: rootFolderName,
      type: 'folder',
      createdBy: userId,
      parentId: parentId || null,
    });
    await rootFolder.save();

    for (const file of files) {
      const relativePath = file.originalname || file.webkitRelativePath || '';
      const pathParts = relativePath.split('/').filter(Boolean);
      const fileName = pathParts.pop();
      const folderPathParts = pathParts.slice(1);

      const currentFolder = await getOrCreateNestedFolder(
        folderPathParts,
        rootFolder,
        userId
      );
      await saveUploadedFileToFolder(
        file,
        userId,
        pathParts,
        fileName,
        currentFolder
      );
    }

    const populatedFolder = await Folder.findById(rootFolder._id)
      .populate({
        path: 'subfolders',
        populate: [
          { path: 'subfolders' },
          { path: 'documents' },
          { path: 'images' },
        ],
      })
      .populate('documents images')
      .exec();

    return populatedFolder;
  }
}

module.exports = new UserService();
