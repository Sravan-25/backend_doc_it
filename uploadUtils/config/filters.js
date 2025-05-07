const logger = require('../../utils/logger');
const { imageTypes, documentTypes } = require('../../constants/allowedTypes');

const imageFilter = (req, file, cb) => {
  const extension = file.originalname.split('.').pop().toLowerCase();
  if (!imageTypes.includes(extension)) {
    logger.warn('Invalid image type', { extension, file: file.originalname });
    return cb(new Error(`Only ${imageTypes.join(', ')} files are allowed`));
  }
  cb(null, true);
};

const documentFilter = (req, file, cb) => {
  const extension = file.originalname.split('.').pop().toLowerCase();
  if (!documentTypes.includes(extension)) {
    logger.warn('Invalid document type', {
      extension,
      file: file.originalname,
    });
    return cb(new Error(`Only ${documentTypes.join(', ')} files are allowed`));
  }
  logger.info('Document filter passed', { extension, file: file.originalname });
  cb(null, true);
};

module.exports = {
  imageFilter,
  documentFilter,
};
