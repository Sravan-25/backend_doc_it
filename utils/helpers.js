const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

module.exports = {
  generateRandomToken: (bytes = 32) => crypto.randomBytes(bytes).toString('hex'),
  deleteFile: (filename, folder = '') => {
    const filePath = path.join(__dirname, `../../uploads/${folder}`, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  },
  filterObject: (obj, ...allowedFields) => {
    const filteredObj = {};
    Object.keys(obj).forEach(key => {
      if (allowedFields.includes(key)) filteredObj[key] = obj[key];
    });
    return filteredObj;
  }
};