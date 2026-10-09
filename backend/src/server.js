require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const cvRouter = require('./routes/cv');
const candidateRouter = require('./routes/candidates');
const matchRouter = require('./routes/matches');
const jobRouter = require('./routes/jobs');
const { seedLearningResources } = require('./config/seedResources');

// Validate environment variables
validateEnv();

// Connect to database (skip in test mode unless explicit)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    seedLearningResources().catch(() => {});
  });
}

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/cvs', cvRouter);
app.use('/api/v1/candidates', candidateRouter);
app.use('/api/v1/matches', matchRouter);
app.use('/api/v1/jobs', jobRouter);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[INFO] Express server running on port ${PORT}`);
  });
}

module.exports = app;
