
module.exports = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
      });
    }

    if (!req.user.verified) {
      return res.status(403).json({
        success: false,
        error: 'Account not verified. Please verify your email.',
      });
    }

    next();
  };
};
