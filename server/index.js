const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
require('dotenv').config();

const app = express();

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Dynamic CORS configuration for production and development
const normalize = (url) => (url || '').replace(/\/$/, '');
const FRONTEND_URL_DEFAULT = 'https://zipfix-ai.vercel.app';
const FRONTEND_URL = normalize(process.env.FRONTEND_URL || FRONTEND_URL_DEFAULT);
const FRONTEND_URLS = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(normalize);

const STATIC_ALLOWED = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:3000',
  FRONTEND_URL,
  ...FRONTEND_URLS,
].map(normalize));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);

    const requestOrigin = normalize(origin);

    // Allow any Vercel preview or production domain
    const allowVercel = requestOrigin.endsWith('.vercel.app');

    if (STATIC_ALLOWED.has(requestOrigin) || allowVercel) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
// Safe generic OPTIONS handler (avoid '*' route with Express 5)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

// Correlation / Request ID middleware
app.use((req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  logger.info({ msg: 'request:start', id, method: req.method, url: req.originalUrl });
  res.on('finish', () => {
    logger.info({ msg: 'request:finish', id, status: res.statusCode });
  });
  next();
});

// Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/auth', authLimiter);

// Optional: clearer response when CORS blocks an origin
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: origin not allowed', origin: req.headers.origin || null });
  }
  return next(err);
});

// Body parser (JSON) syntax error handler to avoid HTML 400 responses
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload', details: err.message });
  }
  next(err);
});

// MongoDB connection (require env var in production)
const isProd = process.env.NODE_ENV === 'production';
let mongoUri = process.env.MONGODB_URI || '';

// If an Atlas URI was provided without a db name, append a default one
if (mongoUri && /mongodb\.net\/?$/.test(mongoUri)) {
  mongoUri = `${mongoUri.replace(/\/?$/, '')}/flatfix?retryWrites=true&w=majority`;
}

if (!mongoUri) {
  if (isProd) {
    console.error('MONGODB_URI is required in production. Set it to your MongoDB Atlas connection string.');
    process.exit(1);
  } else {
    mongoUri = 'mongodb://127.0.0.1:27017/flatfix';
  }
}

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const techAppRoutes = require('./routes/techApplications');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', techAppRoutes);

// Health check to verify frontend-backend connectivity
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Backend-only root
app.get('/', (req, res) => {
  res.json({ message: 'ZipFix.ai API (Render) running. Frontend is on Vercel.' });
});

// Global fallback error handler (ensures JSON, not HTML)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info({ msg: 'server:start', port: PORT });
});
