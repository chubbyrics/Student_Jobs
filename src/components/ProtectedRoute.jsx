import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import UnauthorizedAccess from './UnauthorizedAccess';

/**
 * ProtectedRoute component that ensures only authenticated users with specific roles
 * can access certain routes
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {string} props.userRole - Current user role
 * @param {Array<string>} [props.allowedRoles] - Roles that are allowed to access the route
 * @param {string} [props.redirectPath] - Path to redirect to if unauthorized
 * @param {boolean} [props.useUnauthorizedPage] - Whether to show unauthorized page instead of redirecting
 * @returns {React.ReactNode} - Either the protected content or a redirect
 */
const ProtectedRoute = ({ 
  children, 
  isAuthenticated, 
  userRole, 
  allowedRoles = [], 
  redirectPath = '/login',
  useUnauthorizedPage = true
}) => {
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Either show unauthorized page or redirect
    if (useUnauthorizedPage) {
      return (
        <UnauthorizedAccess 
          message="You need to be logged in to access this page."
          redirectPath={redirectPath} 
          buttonText="Log In"
        />
      );
    }
    
    // Otherwise, perform a redirect
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // If roles are specified, check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    toast.error(`Access denied. This area is for ${allowedRoles.join(', ')} only.`, {
      position: 'top-center',
      autoClose: 3000,
    });
    
    // Either show unauthorized page or redirect
    if (useUnauthorizedPage) {
      return (
        <UnauthorizedAccess 
          message={`This area is only accessible to ${allowedRoles.join(', ')}. Your current role is ${userRole}.`}
          redirectPath="/" 
          buttonText="Go to Home"
        />
      );
    }
    
    // Otherwise, redirect to home
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has the required role
  return children;
};

export default ProtectedRoute; 