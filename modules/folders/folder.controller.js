const folderService = require('./folder.service');
const ApiResponse = require('../../utils/apiResponse');
const { FOLDER } = require('../../constants/messages');
const logger = require('../../utils/logger');

exports.createFolder = async (req, res) => {
  try {
    const { name, type, parentId } = req.body;
    const userId = req.user.id;

    const folder = await folderService.createFolder({
      name,
      type,
      parentId,
      userId,
    });

    new ApiResponse(res).success(folder, FOLDER.CREATED);
  } catch (error) {
    logger.error(`Create Folder Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.getAllFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const folders = await folderService.getAllFolders(userId);

    new ApiResponse(res).success(folders, FOLDER.FETCHED);
  } catch (error) {
    logger.error(`Get All Folders Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.getFolderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const folder = await folderService.getFolderById(id, userId);
    if (!folder) {
      return new ApiResponse(res).error(FOLDER.NOT_FOUND, 404);
    }

    new ApiResponse(res).success(folder, FOLDER.FETCHED);
  } catch (error) {
    logger.error(`Get Folder By ID Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.updateFolderById = async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user.id;
    const { name, type } = req.body;

    const updatedFolder = await folderService.updateFolderById(
      folderId,
      userId,
      { name, type }
    );

    new ApiResponse(res).success(
      updatedFolder,
      FOLDER.UPDATED ?? 'Folder updated successfully'
    );
  } catch (error) {
    logger.error(`Get Folder By ID Error: ${error.message}`);
    new ApiResponse(res).error(error.message, 500);
  }
};

exports.deleteFolderById = async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user.id;

    const folder = await folderService.deleteFolderById(folderId, userId);

    new ApiResponse(res).success(folder, FOLDER.DELETED);
  } catch (error) {
    logger.error(`Delete Folder Error: ${error.message}`);
    new ApiResponse(res).error(error.message, error.statusCode || 500);
  }
};

exports.uploadFolder = async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const userId = req.user._id;
    const files = req.files;

    const result = await folderService.uploadFolder(folderId, userId, files);

    new ApiResponse(res).success(result, FOLDER.UPLOADED);
  } catch (error) {
    logger.error(`Upload Folder Error: ${error.message}`);
    new ApiResponse(res).error(error.message, error.statusCode || 500);
  }
};

exports.downloadFolder = async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user._id;

    const archive = await folderService.downloadFolderContent(folderId, userId);
    if (!archive) {
      return new ApiResponse(res).error(FOLDER.NOT_FOUND, 404);
    }
    res.attachment(`${folderId}.zip`);
    archive.pipe(res);
    archive.finalize();
  } catch (error) {
    logger.error(`Delete Folder Error: ${error.message}`);
    new ApiResponse(res).error(error.message, error.statusCode || 500);
  }
};

exports.uploadMultipleFolders = async (req, res) => {
  try {
    const userId = req.user._id;
    const files = req.files;
    const parentId = req.body.parentId || null;
    ``;
    const populatedFolder = await folderService.uploadMultipleFolders(
      userId,
      files,
      parentId
    );

    new ApiResponse(res).success(populatedFolder, FOLDER.UPLOADED);
  } catch (error) {
    logger.error(`Delete Folder Error: ${error.message}`);
    new ApiResponse(res).error(error.message, error.statusCode || 500);
  }
};
