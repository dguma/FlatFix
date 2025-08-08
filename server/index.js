const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Dynamic CORS configuration for production and development
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://flat-fix.vercel.app').replace(/\/$/, '');
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const normalize = (url) => (url || '').replace(/\/$/, '');
    const requestOrigin = normalize(origin);

    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      FRONTEND_URL
    ].map(normalize);

    if (allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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

// Backend-only: do not serve React from Render
app.get('/', (req, res) => {
  res.json({ message: 'FlatFix API (Render) running. Frontend is on Vercel.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
