const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const { documentDir } = require('../config/constants');

class FileManager {
  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'Uploads');
    this.directories = {
      documents: 'safe',
      images: 'images',
      folders: 'folders',
    };
    this.initializeDirectories();
  }

  initializeDirectories() {
    try {
      if (!fs.existsSync(this.baseUploadDir)) {
        fs.mkdirSync(this.baseUploadDir, { recursive: true, mode: 0o755 });
      }

      Object.values(this.directories).forEach((dir) => {
        const fullPath = path.join(this.baseUploadDir, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true, mode: 0o755 });
        }
      });
    } catch (error) {
      logger.error('Error initializing upload directories:', error);
      throw new Error('Failed to initialize upload directories');
    }
  }

  getUploadPath(fileType) {
    const directory = this.directories[fileType];
    if (!directory) {
      throw new Error(`Invalid file type: ${fileType}`);
    }
    return path.join(this.baseUploadDir, directory);
  }

  moveFile(sourcePath, fileType) {
    try {
      const fileName = path.basename(sourcePath);
      const targetDir =
        fileType === 'documents' ? documentDir : this.getUploadPath(fileType);
      const targetPath = path.join(targetDir, fileName);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });
      }

      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);

      return path.relative(this.baseUploadDir, targetPath).replace(/\\/g, '/');
    } catch (error) {
      logger.error('Error moving file:', error);
      throw new Error('Failed to move uploaded file');
    }
  }

  verifyFileExists(filePath) {
    const fullPath = path.join(this.baseUploadDir, filePath);
    return fs.existsSync(fullPath);
  }

  deleteFile(filePath) {
    try {
      const fullPath = path.join(this.baseUploadDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }
}

module.exports = new FileManager();
