require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/swagger.yaml');
const { connectDB } = require('./config/db');
const errorHandler = require('./middlewares/error.middleware');
const passport = require('./config/passport');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const deviceRoutes = require('./modules/device/device.routes');
const folderRoutes = require('./modules/folders/folder.routes');
const documentRoutes = require('./modules/documents/document.routes');
const imageRoutes = require('./modules/images/image.routes');
const app = express();

// Connect to database
connectDB();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dotenv config
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/folders', folderRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handling
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, 'localhost', () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
module.exports = app;
