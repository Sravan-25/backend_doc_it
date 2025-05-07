const { validationResult } = require('express-validator');

const validate = (validationRules) => {
  return async (req, res, next) => {
    await Promise.all(validationRules.map((rule) => rule.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  };
};

module.exports = validate;
