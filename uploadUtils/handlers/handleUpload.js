const multer = require('multer');
const logger = require('../../utils/logger');

const handleUpload = (uploadFunction) => (req, res, next) => {
  uploadFunction(req, res, (err) => {
    if (err) {
      const errorMsg =
        err instanceof multer.MulterError
          ? err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large. Max 100MB allowed.'
            : `Multer error: ${err.message} (field: ${err.field || 'unknown'})`
          : err.message || 'Upload failed';
      logger.error(`Upload error: ${errorMsg}`, { error: err });
      return res.status(400).json({ success: false, error: errorMsg });
    }

    if (!req.file && (!req.files || Object.keys(req.files).length === 0)) {
      logger.warn('No files uploaded in request');
      return res
        .status(400)
        .json({ success: false, error: 'No files uploaded.' });
    }

    next();
  });
};

module.exports = handleUpload;
