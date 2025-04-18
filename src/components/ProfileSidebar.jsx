import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/ProfileSidebar.css';

const ProfileSidebar = ({ isOpen, onClose, userProfile, onLogout }) => {
  const navigate = useNavigate();
  const isEmployer = userProfile.title?.toLowerCase().includes('employer') || 
                     userProfile.title?.toLowerCase() === 'employer';
  
  // Function to format role display
  const formatRole = (role) => {
    if (isEmployer) return "Employer";
    return "Student";
  };

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div className={`profile-sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`profile-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="close-button" onClick={onClose}>×</button>
          <div className="profile-picture-sidebar">
            {userProfile.profilePicture ? (
              <img src={userProfile.profilePicture} alt="Profile" />
            ) : (
              <div className="avatar-sidebar">{userProfile.name.charAt(0)}</div>
            )}
          </div>
          <h3>{userProfile.name}</h3>
          <p className="sidebar-email">{userProfile.email}</p>
          <span className="role-badge">
            {formatRole(userProfile.title)}
          </span>
        </div>
        
        <div className="sidebar-links">
          <button className="sidebar-link" onClick={() => handleNavigation('/profile')}>
            <i className="fas fa-user"></i> My Profile
          </button>
          <button className="sidebar-link" onClick={() => handleNavigation('/dashboard')}>
            <i className="fas fa-tachometer-alt"></i> {isEmployer ? 'Employer Dashboard' : 'Student Dashboard'}
          </button>
          {isEmployer ? (
            <button className="sidebar-link" onClick={() => handleNavigation('/post-job')}>
              <i className="fas fa-plus-circle"></i> Post Job
            </button>
          ) : (
            <button className="sidebar-link" onClick={() => handleNavigation('/jobs')}>
              <i className="fas fa-briefcase"></i> Browse Jobs
            </button>
          )}
          <button className="sidebar-link" onClick={() => handleNavigation('/')}>
            <i className="fas fa-home"></i> Home Page
          </button>
        </div>
        
        <div className="sidebar-footer">
          <button className="logout-button" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Log Out
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileSidebar; 