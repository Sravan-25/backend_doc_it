const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    // .replace(/\s+/g, '_')
    // .replace(/[^a-zA-Z0-9_]/g, '');
    const fileName = `${baseName}-${uniqueSuffix}${extension}`;
    cb(null, fileName);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only images (JPEG, PNG, GIF) are allowed.'),
      false
    );
  }
};

const documentFilter = (req, file, cb) => {
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedDocTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only documents (PDF, DOC, DOCX) are allowed.'
      ),
      false
    );
  }
};

const limits = {
  fileSize: 100 * 1024 * 1024,
};

const uploadSingleImage = multer({
  storage,
  fileFilter: imageFilter,
  limits,
}).single('image');

const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFilter,
  limits,
}).fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 },
]);

const uploadSingleDoc = multer({
  storage,
  fileFilter: documentFilter,
  limits,
}).single('document');

const uploadMultipleDocs = multer({
  storage,
  fileFilter: documentFilter,
  limits,
}).fields([
  { name: 'document', maxCount: 1 },
  { name: 'document2', maxCount: 1 },
]);

const handleUpload = (uploadFunction) => (req, res, next) => {
  uploadFunction(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error:
            err.code === 'LIMIT_FILE_SIZE'
              ? 'File size too large. Max 100MB allowed.'
              : err.message,
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed',
      });
    }

    if (!req.file && (!req.files || Object.keys(req.files).length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'No files were uploaded',
      });
    }

    if (req.files) {
      // console.log(
      //   'Multer files:',
      //   req.files.map((f) => ({
      //     originalname: f.originalname,
      //     webkitRelativePath: f.webkitRelativePath,
      //     filename: f.filename,
      //     path: f.path,
      //   }))
      // );
    }

    next();
  });
};

const uploadFilesForFolder = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const folderType = req.body.folderType || 'documents';
    const allowedTypes =
      folderType === 'images'
        ? ['image/jpeg', 'image/png', 'image/gif']
        : [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${folderType} folder.`), false);
    }
  },
  limits,
}).array('files');

const uploadMultipleFolders = multer({
  storage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  limits,
}).array('files');

module.exports = {
  uploadSingleImage: handleUpload(uploadSingleImage),
  uploadMultipleImages: handleUpload(uploadMultipleImages),
  uploadSingleDoc: handleUpload(uploadSingleDoc),
  uploadMultipleDocs: handleUpload(uploadMultipleDocs),
  uploadDir,
  uploadFilesForFolder: handleUpload(uploadFilesForFolder),
  uploadMultipleFolders: handleUpload(uploadMultipleFolders),
};
