const { ObjectId } = require('mongodb');
const validator = require('validator');

module.exports = {
  isValidObjectId: (id) => ObjectId.isValid(id) && new ObjectId(id).toString() === id,
  isEmail: (email) => validator.isEmail(email),
  isStrongPassword: (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  }
};