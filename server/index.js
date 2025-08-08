const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Dynamic CORS configuration for production and development
const normalize = (url) => (url || '').replace(/\/$/, '');
const FRONTEND_URL_DEFAULT = 'https://flat-fix.vercel.app';
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
app.use(express.json());

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

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);

// Health check to verify frontend-backend connectivity
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Backend-only root
app.get('/', (req, res) => {
  res.json({ message: 'FlatFix API (Render) running. Frontend is on Vercel.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
