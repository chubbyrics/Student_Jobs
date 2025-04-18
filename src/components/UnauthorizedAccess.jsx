import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/UnauthorizedAccess.css';

/**
 * Component displayed when a user attempts to access an unauthorized route
 * 
 * @param {Object} props - Component props
 * @param {string} [props.message] - Custom message to display
 * @param {string} [props.redirectPath] - Path to redirect to
 * @param {string} [props.buttonText] - Text for the action button
 * @returns {React.ReactNode} Unauthorized access UI
 */
const UnauthorizedAccess = ({ 
  message = "You don't have permission to access this page.",
  redirectPath = "/login",
  buttonText = "Log In"
}) => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="lock-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>{message}</p>
        <div className="action-buttons">
          <Link to="/" className="home-button">
            Go to Home
          </Link>
          <Link to={redirectPath} className="login-button">
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccess; 