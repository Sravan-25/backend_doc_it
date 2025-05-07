const DocumentService = require('./document.service');
const ApiResponse = require('../../utils/apiResponse');
const { DOCUMENT, USER } = require('../../constants/messages');
const logger = require('../../utils/logger');
const {
  cleanupFiles,
  getFileExtension,
  validateFolderFileTypes,
} = require('../../helpers/fileHelper');

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return new ApiResponse(res).error('Document file is required', 400);
    }

    const { name } = req.body;
    const { folderId } = req.params;

    if (!name) {
      cleanupFiles([req.file.filename]);
      return new ApiResponse(res).error(DOCUMENT.UPLOAD_FAILED_NAME, 400);
    }

    const uploadedBy = req.user?._id;
    if (!uploadedBy) {
      cleanupFiles([req.file.filename]);
      return new ApiResponse(res).error(USER.LOGGED_ERROR, 401);
    }

    const result = await DocumentService.uploadDocument(
      req.file,
      name,
      folderId,
      uploadedBy
    );

    return new ApiResponse(res).success(DOCUMENT.CREATED, result, 201);
  } catch (error) {
    logger.error('Error uploading document:', error);
    if (req.file) {
      cleanupFiles([req.file.filename]);
    }
    return new ApiResponse(res).error(
      error.message || DOCUMENT.CREATION_FAILED,
      error.statusCode || 500
    );
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const documents = await DocumentService.getAllDocuments(userId);
    return new ApiResponse(res).success(
      DOCUMENT.LIST_RETRIEVED,
      documents,
      200
    );
  } catch (error) {
    logger.error('Error fetching documents:', error);
    return new ApiResponse(res).error(
      error.message || DOCUMENT.FETCH_FAILED,
      error.statusCode || 500
    );
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;
    const document = await DocumentService.getDocumentById(documentId, userId);

    return new ApiResponse(res).success(
      DOCUMENT.DOCUMENT_RETRIEVED,
      document,
      200
    );
  } catch (error) {
    logger.error('Error fetching document:', error);
    return new ApiResponse(res).error(
      error.message || DOCUMENT.FETCH_FAILED,
      error.statusCode || 500
    );
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;

    if (!documentId) {
      throw new ApiResponse(400, DOCUMENT.INVALID_ID);
    }

    const result = await DocumentService.deleteDocument(documentId, userId);

    return new ApiResponse(res).success(DOCUMENT.DELETED, result, 200);
  } catch (error) {
    logger.error('Error deleting document:', error);
    return new ApiResponse(res).error(
      error.message || DOCUMENT.DELETE_FAILED,
      error.statusCode || 500
    );
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;

    const archive = await DocumentService.downloadDocument(documentId, userId);

    if (!archive) {
      return new ApiResponse(res).error(DOCUMENT.NOT_FOUND, 404);
    }

    res.attachment(`${documentId}.zip`);
    archive.pipe(res);
    archive.finalize((err) => {
      if (err) {
        logger.error('Error finalizing archive:', err);
        return new ApiResponse(res).error(DOCUMENT.DOWNLOAD_FAILED, 500);
      }
    });
  } catch (error) {
    logger.error('Error downloading document:', error);
    return new ApiResponse(res).error(
      error.message || DOCUMENT.DOWNLOAD_FAILED,
      error.statusCode || 500
    );
  }
};

exports.updateDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;
    const updatedDocument = await DocumentService.updateDocumentById(
      documentId,
      userId,
      req.body,
      req.files
    );

    return new ApiResponse(res).success(DOCUMENT.UPDATED, updatedDocument, 200);
  } catch (error) {
    logger.error('Error while updating document:', error);
    return new ApiResponse(res).error(
      error.message || DOCUMENT.UPDATE_FAILED,
      error.statusCode || 500
    );
  }
};

exports.uploadMultipleDocuments = async (req, res) => {
  try {
    const { name1, name2 } = req.body;
    const folderId = req.params.folderId;
    const file1 = req.files?.document?.[0];
    const file2 = req.files?.document2?.[0];

    if (!file1 || !file2) {
      const missing = !file1 ? 'document' : 'document2';
      logger.warn(`Missing file in uploadMultipleDocuments: ${missing}`, {
        files: req.files,
      });
      if (file1) cleanupFiles([file1.filename]);
      if (file2) cleanupFiles([file2.filename]);
      return new ApiResponse(res).error(`Missing ${missing} file`, 400);
    }

    if (!name1 || !name2) {
      cleanupFiles([file1.filename, file2.filename]);
      return new ApiResponse(res).error(DOCUMENT.UPLOAD_FAILED_NAME, 400);
    }

    const uploadedBy = req.user?._id;
    if (!uploadedBy) {
      cleanupFiles([file1.filename, file2.filename]);
      return new ApiResponse(res).error(USER.LOGGED_ERROR, 401);
    }

    const result = await DocumentService.uploadMultipleDocuments(
      file1,
      file2,
      name1,
      name2,
      folderId,
      uploadedBy
    );

    return new ApiResponse(res).success(DOCUMENT.CREATED, result, 201);
  } catch (error) {
    logger.error('Error uploading multiple documents:', error);
    const files = [req.files?.document?.[0], req.files?.document2?.[0]];
    cleanupFiles(files.filter(Boolean).map((f) => f.filename));
    return new ApiResponse(res).error(
      error.message || DOCUMENT.UPLOAD_MULTIPLE_FAILED,
      error.statusCode || 500
    );
  }
};
