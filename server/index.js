const express = require('express');

// Top-level error logging for Heroku troubleshooting
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Dynamic CORS configuration for production and development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.FRONTEND_URL // This will be your Heroku app URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());


// Serve static files from the React app build directory and handle React Router
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flatfix';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join technician room for receiving service requests
  socket.on('join-technician', (technicianId) => {
    socket.join('technicians');
    console.log(`Technician ${technicianId} joined technicians room`);
  });

  // Join customer room for receiving updates
  socket.on('join-customer', (customerId) => {
    socket.join(`customer-${customerId}`);
    console.log(`Customer ${customerId} joined their room`);
  });

  // Handle new service requests
  socket.on('new-service-request', (requestData) => {
    // Broadcast to all available technicians
    socket.to('technicians').emit('service-request-available', requestData);
    console.log('New service request broadcasted to technicians');
  });

  // Handle technician claiming a request
  socket.on('claim-request', (claimData) => {
    // Notify customer about technician assignment
    socket.to(`customer-${claimData.customerId}`).emit('technician-assigned', claimData);
    console.log(`Request claimed by technician ${claimData.technicianId}`);
  });

  // Handle customer approval/rejection
  socket.on('approve-technician', (approvalData) => {
    if (approvalData.approved) {
      // Notify technician that they're approved
      socket.to('technicians').emit('assignment-approved', approvalData);
      // Start location tracking
      socket.emit('start-tracking', approvalData);
    } else {
      // Return request to marketplace
      socket.to('technicians').emit('service-request-available', approvalData.originalRequest);
    }
  });

  // Handle location updates
  socket.on('location-update', (locationData) => {
    // Send location to customer
    socket.to(`customer-${locationData.customerId}`).emit('technician-location', locationData);
  });

  // Handle job started event
  socket.on('job-started', (jobData) => {
    socket.to(`customer-${jobData.customerId}`).emit('job-started', jobData);
    console.log(`Job started by technician for customer ${jobData.customerId}`);
  });

  // Handle technician arrived event
  socket.on('technician-arrived', (arrivalData) => {
    socket.to(`customer-${arrivalData.customerId}`).emit('technician-arrived', arrivalData);
    console.log(`Technician arrived for customer ${arrivalData.customerId}`);
  });

  // Handle job completed event
  socket.on('job-completed', (completionData) => {
    socket.to(`customer-${completionData.customerId}`).emit('job-completed', completionData);
    console.log(`Job completed for customer ${completionData.customerId}`);
  });

  // Handle service completion
  socket.on('service-completed', (completionData) => {
    socket.to(`customer-${completionData.customerId}`).emit('service-completed', completionData);
    console.log(`Service completed for customer ${completionData.customerId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
// Import and use route files
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);

// Serve React app for all other routes (catch-all handler)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'FlatFix API Server Running' });
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
