# 🔧 FlatFix - On-Demand Tire Services PWA

FlatFix is a Progressive Web App (PWA) that connects customers with professional tire technicians for on-demand tire services. Built with the MERN stack and WebSockets for real-time communication.

## 🚗 Features

### For Customers
- **Emergency Tire Help**: Request immediate assistance for tire problems
- **Real-time Tracking**: See technician location and estimated arrival time
- **Multiple Service Types**: 
  - Air inflation ($20)
  - Spare tire replacement + air ($35) 
  - Local shop coordination ($45)
- **PWA Capabilities**: Install on mobile device, works offline
- **Secure Payments**: Pay for services (customers pay shops directly for parts)

### For Technicians
- **Job Marketplace**: First-come-first-serve job claiming system
- **Real-time Notifications**: Get notified of new service requests instantly
- **Location Services**: GPS tracking for customer visibility
- **Availability Toggle**: Control when you're accepting jobs
- **Payment Processing**: Automatic payment collection for services

### Technical Features
- **Real-time Communication**: WebSocket integration with Socket.io
- **PWA**: Service workers, offline capability, installable
- **Responsive Design**: Mobile-first, works on all devices
- **Authentication**: JWT-based secure authentication
- **Database**: MongoDB with Mongoose ODM
- **Geolocation**: GPS integration for precise location services

## 🛠 Tech Stack

**Frontend:**
- React 18 with TypeScript
- Socket.io-client for real-time features
- React Router for navigation
- Progressive Web App capabilities
- Responsive CSS with mobile-first design

**Backend:**
- Node.js with Express.js
- Socket.io for WebSocket connections
- MongoDB with Mongoose
- JWT authentication
- RESTful API design

**Additional Tools:**
- Google Maps API for location services
- BCrypt for password hashing
- CORS for cross-origin requests
- Nodemon for development

## 📱 Service Workflow

1. **Customer Request**: Customer posts "need help" with GPS location
2. **Broadcast**: System broadcasts request to all available technicians
3. **Claiming**: Technicians compete to claim jobs (first-come-first-serve)
4. **Approval**: Customer can approve or decline assigned technician
5. **Service**: Real-time tracking during service delivery
6. **Payment**: Secure payment processing for service fees
7. **Completion**: Service completion and rating system

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd FlatFix
npm run install-deps
```

2. **Environment Configuration:**

Create `server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flatfix
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

Create `client/.env` file:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
REACT_APP_API_URL=http://localhost:5000
```

**Note:** You'll need to get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/) and enable the following APIs:
- Maps JavaScript API
- Geocoding API
- Distance Matrix API
- Directions API

3. **Start Development:**
```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
npm run server  # Backend on http://localhost:5000
npm run client  # Frontend on http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

## 📂 Project Structure

```
FlatFix/
├── client/                 # React frontend
│   ├── public/            # PWA manifest, icons
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts (Auth, Socket)
│   │   ├── pages/         # Page components
│   │   └── ...
├── server/                # Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── index.js          # Server entry point
│   └── .env              # Environment variables
├── package.json          # Root package.json with scripts
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Services
- `POST /api/services/request` - Create service request
- `GET /api/services/available` - Get available jobs (technicians)
- `POST /api/services/claim/:requestId` - Claim a job
- `GET /api/services/my-requests` - Customer's requests
- `GET /api/services/my-jobs` - Technician's jobs
- `PATCH /api/services/status/:requestId` - Update service status

### Users
- `PATCH /api/users/location` - Update user location
- `PATCH /api/users/availability` - Toggle technician availability
- `GET /api/users/technicians/nearby` - Find nearby technicians

## 🌐 WebSocket Events

### Customer Events
- `join-customer` - Join customer room
- `new-service-request` - Broadcast new request
- `approve-technician` - Approve/reject technician

### Technician Events
- `join-technician` - Join technician room
- `claim-request` - Claim a service request
- `location-update` - Send location updates
- `service-completed` - Mark service as completed

## 💳 Payment Structure

- **Base Service Fee**: $20 for technician to come to location
- **Air Inflation**: $20 total (base fee only)
- **Spare Replacement**: $35 total ($20 base + $15 service)
- **Shop Coordination**: $45 total ($20 base + $25 coordination)

*Note: Customers pay tire shops directly for any tire purchases*

## 📱 PWA Features

- **Installable**: Can be installed on mobile devices
- **Offline Capability**: Core functionality works offline
- **Push Notifications**: Real-time updates even when app is closed
- **Responsive**: Optimized for mobile and desktop
- **Fast**: Service worker caching for instant loading

## 🔧 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Environment Variables
Required environment variables in `server/.env`:
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token signing
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for location services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@flatfix.com or create an issue in the repository.

---

**FlatFix** - Fixing tires, one call at a time! 🚗💨

## 🌐 Live Demo

The app is deployed and available at: **https://flatfix-roadside-app-193f7aaa4704.herokuapp.com/**

Test the real-time features with multiple devices/browsers!
