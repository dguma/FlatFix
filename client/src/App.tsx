import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import CustomerDashboard from './pages/CustomerDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ServiceRequest from './pages/ServiceRequest';
import ServiceSelection from './pages/ServiceSelection';
import ReadinessCheck from './pages/ReadinessCheck';
import BookingConfirmation from './pages/BookingConfirmation';
import JobVerification from './pages/JobVerification';
import TechnicianSignUp from './pages/TechnicianSignUp';
import TechnicianDashboardRealtime from './pages/TechnicianDashboardRealtime';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/service-selection" element={<ServiceSelection />} />
              <Route path="/readiness-check" element={<ReadinessCheck />} />
              <Route path="/booking-confirmation" element={<BookingConfirmation />} />
              <Route path="/job-verification" element={<JobVerification />} />
              <Route path="/technician-signup" element={<TechnicianSignUp />} />
              <Route 
                path="/change-password" 
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer-dashboard" 
                element={
                  <ProtectedRoute userType="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/technician-dashboard" 
                element={
                  <ProtectedRoute userType="technician">
                    <TechnicianDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/technician-dashboard-realtime" 
                element={
                  <ProtectedRoute userType="technician">
                    <TechnicianDashboardRealtime />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/request-service" 
                element={
                  <ProtectedRoute userType="customer">
                    <ServiceRequest />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
