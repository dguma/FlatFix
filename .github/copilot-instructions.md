# FlatFix - Tire Service PWA Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
FlatFix is a Progressive Web App (PWA) for on-demand tire services built with the MERN stack and WebSockets.

## Architecture
- **Frontend**: React TypeScript PWA with service workers
- **Backend**: Node.js/Express with Socket.io for real-time communication
- **Database**: MongoDB for data persistence
- **Real-time**: WebSocket integration for live tracking and communication

## Service Types
1. **Air Inflation Service** - $20 base fee + service fee
2. **Spare Tire Replacement + Air** - $20 base fee + additional service fee
3. **Local Shop Coordination** - $20 base fee + delivery fee (customers pay shops directly)

## Workflow
1. Customer posts "need help" request with GPS location
2. System pins location and broadcasts to available technicians
3. First-come-first-serve: technicians claim jobs
4. Customer approves/declines assigned technician
5. Real-time tracking during service
6. Payment processing for service fees only

## Key Features to Implement
- GPS location services with Google Maps integration
- Real-time WebSocket communication between customers and technicians
- User authentication for customers and technicians
- Service request marketplace
- Payment processing for service fees
- PWA capabilities (offline functionality, push notifications)
- Mobile-first responsive design

## Technology Stack
- React with TypeScript
- Socket.io for real-time features
- Google Maps API for location services
- MongoDB with Mongoose
- Express.js with CORS
- JWT authentication
- PWA with service workers

## Payment Structure
- Base service fee: $20
- Additional fees based on service type
- No handling of tire shop payments (direct customer-to-shop transactions)
