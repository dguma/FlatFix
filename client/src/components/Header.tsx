import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          🔧 FlatFix
        </Link>
        
        <nav className="nav">
          {user ? (
            <>
              <span className="welcome">Welcome, {user.name}</span>
              {user.userType === 'customer' ? (
                <Link to="/customer-dashboard" className="nav-link">
                  Dashboard
                </Link>
              ) : (
                <Link to="/technician-dashboard" className="nav-link">
                  Dashboard
                </Link>
              )}
              <Link to="/change-password" className="nav-link">
                Change Password
              </Link>
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
