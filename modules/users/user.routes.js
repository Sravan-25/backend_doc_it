const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const userValidator = require('./user.validator');
const validate = require('../../middlewares/validate.middleware');

router.get('/', authMiddleware, userController.getAllUsers);
router.get(
  '/:id',
  authMiddleware,
  validate(userValidator.getUser),
  userController.getUserById
);
router.put(
  '/:id',
  authMiddleware,
  validate(userValidator.updateUser),
  userController.updateUser
);
router.delete(
  '/:id',
  authMiddleware,
  validate(userValidator.deleteUser),
  userController.deleteUser
);

module.exports = router;
