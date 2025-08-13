import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  confirmPassword: '',
    phone: '',
    userType: 'customer' as 'customer' | 'technician',
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      licensePlate: ''
    }
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicleInfo: {
          ...prev.vehicleInfo,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic client-side validation for password match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Determine if any vehicle info was provided (allow for customer + technician)
      const hasVehicleInfo = Object.values(formData.vehicleInfo).some(v => v && v.toString().trim() !== '');

      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        userType: formData.userType,
        ...(hasVehicleInfo && { vehicleInfo: {
          make: formData.vehicleInfo.make || undefined,
          model: formData.vehicleInfo.model || undefined,
          year: formData.vehicleInfo.year || undefined,
          licensePlate: formData.vehicleInfo.licensePlate || undefined
        } })
      };

      await register(registrationData);
      navigate('/'); // Redirect to home page
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Join FlatFix</h2>
          <p>Create your account to get started</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="userType">I am a:</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="customer">Customer (need tire help)</option>
                <option value="technician">Technician (provide tire services)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter your password"
                minLength={6}
              />
            </div>
            <>
              <h3>Vehicle Information <span style={{fontWeight: 'normal', fontSize: '0.85em'}}>(optional but helps us assist faster)</span></h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vehicle.make">Vehicle Make</label>
                  <input
                    type="text"
                    id="vehicle.make"
                    name="vehicle.make"
                    value={formData.vehicleInfo.make}
                    onChange={handleChange}
                    placeholder="e.g., Toyota"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle.model">Vehicle Model</label>
                  <input
                    type="text"
                    id="vehicle.model"
                    name="vehicle.model"
                    value={formData.vehicleInfo.model}
                    onChange={handleChange}
                    placeholder="e.g., Camry"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vehicle.year">Year</label>
                  <input
                    type="number"
                    id="vehicle.year"
                    name="vehicle.year"
                    value={formData.vehicleInfo.year}
                    onChange={handleChange}
                    placeholder="e.g., 2020"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle.licensePlate">License Plate</label>
                  <input
                    type="text"
                    id="vehicle.licensePlate"
                    name="vehicle.licensePlate"
                    value={formData.vehicleInfo.licensePlate}
                    onChange={handleChange}
                    placeholder="e.g., ABC-123"
                  />
                </div>
              </div>
            </>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
