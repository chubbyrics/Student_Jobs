import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, updateProfile, updatePassword, 
  reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebaseConfig";
import { validateFile, uploadToCloudinary } from "../services/imageUploadService";
import "../styles/Profile.css";

const Profile = () => {
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    title: "Student",
    profileComplete: 70,
    applications: 0,
    interviews: 0,
    offers: 0,
    profilePicture: null
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    title: "Student",
    phone: "",
    location: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Set up a listener for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);
      if (user) {
        setIsAuthenticated(true);
        fetchUserData(user.email, user.displayName || "Student", user.uid);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [auth]);

  const fetchUserData = (email, name, uid) => {
    if (!email) {
      setLoading(false);
      return;
    }

    // Fetch user profile data if available
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // Initialize form data with user data
        setFormData({
          displayName: userData.name || name,
          title: userData.title || userData.role || "Student",
          phone: userData.phone || "",
          location: userData.location || "",
        });
        
        // Calculate profile completeness
        let fieldsComplete = 0;
        let totalFields = 5; // name, title, phone, location, profile picture
        if (userData.name) fieldsComplete++;
        if (userData.title || userData.role) fieldsComplete++;
        if (userData.phone) fieldsComplete++;
        if (userData.location) fieldsComplete++;
        if (userData.profilePicture) fieldsComplete++;
        
        const profileComplete = Math.round((fieldsComplete / totalFields) * 100);
        
        setUserProfile(prev => ({
          ...prev,
          name: userData.name || name,
          email: email,
          title: userData.title || userData.role || "Student",
          phone: userData.phone || "",
          location: userData.location || "",
          profilePicture: userData.profilePicture || null,
          profileComplete: profileComplete
        }));
      } else {
        setUserProfile(prev => ({
          ...prev,
          name: name,
          email: email,
          profileComplete: 20 // Only email/name available
        }));
        
        setFormData({
          displayName: name,
          title: "Student",
          phone: "",
          location: "",
        });
      }
      
      // Fetch applications regardless of profile data
      fetchApplications(email);
    });
  };
  
  const fetchApplications = (email) => {
    const applicationsRef = ref(db, "applications");
    onValue(applicationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userApplications = Object.values(data).filter(
          (app) => app.email === email
        );
        
        const totalApplications = userApplications.length;
        const interviews = userApplications.filter(app => app.status === "Accepted").length;
        const offers = 0; // Placeholder, adjust based on your application status logic
        
        setUserProfile(prev => ({
          ...prev,
          applications: totalApplications,
          interviews: interviews,
          offers: offers
        }));
      }
      
      setLoading(false);
    });
  };
  
  const handleLoginRedirect = () => {
    navigate("/login");
  };
  
  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleEditPassword = () => {
    setShowPasswordModal(true);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordUpdateSuccess(false);
  };
  
  const handleCloseModal = () => {
    setShowEditModal(false);
    setUpdateSuccess(false);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordUpdateSuccess(false);
    setPasswordError("");
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Update display name in Firebase Auth
        await updateProfile(currentUser, {
          displayName: formData.displayName
        });
        
        // Update user data in Firebase Database
        const userRef = ref(db, `users/${currentUser.uid}`);
        await update(userRef, {
          name: formData.displayName,
          // Don't update title/role as it's now read-only
          phone: formData.phone,
          location: formData.location,
          updatedAt: new Date().toISOString()
        });
        
        // Calculate new profile completeness
        let fieldsComplete = 0;
        let totalFields = 5; // name, title, phone, location, profile picture
        if (formData.displayName) fieldsComplete++;
        if (userProfile.title) fieldsComplete++; // Use existing title
        if (formData.phone) fieldsComplete++;
        if (formData.location) fieldsComplete++;
        if (userProfile.profilePicture) fieldsComplete++;
        
        const profileComplete = Math.round((fieldsComplete / totalFields) * 100);
        
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          name: formData.displayName,
          // Keep the same title
          phone: formData.phone,
          location: formData.location,
          profileComplete: profileComplete
        }));
        
        setUpdateSuccess(true);
        setTimeout(() => {
          setShowEditModal(false);
          setUpdateSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordUpdateLoading(true);
    setPasswordError("");
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordUpdateLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setPasswordUpdateLoading(false);
      return;
    }
    
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          passwordData.currentPassword
        );
        
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password
        await updatePassword(currentUser, passwordData.newPassword);
        
        setPasswordUpdateSuccess(true);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordUpdateSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError("Current password is incorrect");
      } else if (error.code === 'auth/weak-password') {
        setPasswordError("Password is too weak. Use at least 6 characters");
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError("Too many attempts. Please try again later");
      } else {
        setPasswordError("Failed to update password. Please try again");
      }
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.success) {
      setImageError(validation.error);
      return;
    }

    setImageError("");
    setImageUploading(true);

    // Upload image to Cloudinary
    try {
      const imageUrl = await uploadToCloudinary(file);

      // Update user profile in Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        await update(userRef, {
          profilePicture: imageUrl,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        setUserProfile(prev => ({
          ...prev,
          profilePicture: imageUrl
        }));

        // Recalculate profile completeness
        let fieldsComplete = 0;
        let totalFields = 5; // name, title, phone, location, profile picture
        if (userProfile.name) fieldsComplete++;
        if (userProfile.title) fieldsComplete++;
        if (userProfile.phone) fieldsComplete++;
        if (userProfile.location) fieldsComplete++;
        fieldsComplete++; // For the newly uploaded profile picture

        const profileComplete = Math.round((fieldsComplete / totalFields) * 100);
        setUserProfile(prev => ({
          ...prev,
          profileComplete: profileComplete
        }));
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setImageError("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  // Helper function to format role for display
  const formatRole = (role) => {
    if (!role) return "Student";
    
    // Capitalize first letter of each word
    return role.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Show loading spinner while checking auth
  if (!authChecked) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading authentication status...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="not-authenticated-container">
          <div className="not-authenticated-card">
            <h2>Please Login to View Your Profile</h2>
            <p>You need to be logged in to access your profile information.</p>
            <button className="login-button" onClick={handleLoginRedirect}>
              LOGIN NOW
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-content">
          <h1>Your Profile</h1>
          <p>Manage your information and track your application progress</p>
        </div>
      </div>

      <div className="profile-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        ) : (
          <>
            <div className="profile-section user-info-section">
              <div className="profile-picture" onClick={handleProfilePictureClick}>
                {userProfile.profilePicture ? (
                  <img src={userProfile.profilePicture} alt="Profile" className="profile-image" />
                ) : (
                  <div className="avatar">{userProfile.name.charAt(0)}</div>
                )}
                <div className="edit-overlay">
                  <span>{imageUploading ? 'Uploading...' : 'Edit'}</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                  disabled={imageUploading}
                />
              </div>
              {imageError && <div className="image-error-message">{imageError}</div>}
              
              <div className="user-details">
                <h2>{userProfile.name}</h2>
                <p className="user-email">{userProfile.email}</p>
                <p className="user-role">{formatRole(userProfile.title)}</p>
                {userProfile.location && (
                  <p className="user-location">{userProfile.location}</p>
                )}
                {userProfile.phone && (
                  <p className="user-phone">{userProfile.phone}</p>
                )}
                
          <div className="profile-completion">
                  <div className="completion-label">
                    <span>Profile Completion</span>
                    <span>{userProfile.profileComplete}%</span>
                  </div>
            <div className="completion-bar">
                    <div 
                      className="completion-progress" 
                      style={{ width: `${userProfile.profileComplete}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-stats-section">
              <div className="stat-card">
                <h3>{userProfile.applications}</h3>
                <p>Applications</p>
              </div>
              <div className="stat-card">
                <h3>{userProfile.interviews}</h3>
                <p>Interviews</p>
              </div>
              <div className="stat-card">
                <h3>{userProfile.offers}</h3>
                <p>Offers</p>
              </div>
            </div>

            <div className="profile-section settings-section">
              <h2>Account Settings</h2>
              
              <div className="settings-list">
                <div className="settings-item">
                  <div className="settings-icon">👤</div>
                  <div className="settings-content">
                    <h3>Personal Information</h3>
                    <p>Update your name, contact details, and personal information</p>
                  </div>
                  <button className="edit-button" onClick={handleEditProfile}>Edit</button>
                </div>
                
                <div className="settings-item">
                  <div className="settings-icon">🔒</div>
                  <div className="settings-content">
                    <h3>Password & Security</h3>
                    <p>Manage your password and security preferences</p>
                  </div>
                  <button className="edit-button" onClick={handleEditPassword}>Edit</button>
                </div>
                
                <div className="settings-item">
                  <div className="settings-icon">📄</div>
                  <div className="settings-content">
                    <h3>Resume & Documents</h3>
                    <p>Manage your resume and other application documents</p>
                  </div>
                  <button className="edit-button">Edit</button>
                </div>
                
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            
            {updateSuccess && (
              <div className="success-message">
                Profile updated successfully!
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-groups">
                <div className="form-group">
                  <label htmlFor="displayName">Full Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="title">Role <span className="readonly-label">(Read-only)</span></label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    className="readonly-input"
                    readOnly
                  />
                  <small className="field-note">Role cannot be changed</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +1 (123) 456-7890"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., New York, NY"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={handleCloseModal}>Cancel</button>
                <button 
                  type="submit" 
                  className={`save-button ${updateLoading ? 'loading' : ''}`}
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="close-button" onClick={handleClosePasswordModal}>×</button>
            </div>
            
            {passwordUpdateSuccess && (
              <div className="success-message">
                Password updated successfully!
              </div>
            )}
            
            {passwordError && (
              <div className="error-message">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-groups">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter your current password"
                    required
                  />
        </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                  />
        </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={handleClosePasswordModal}>Cancel</button>
                <button 
                  type="submit" 
                  className={`save-button ${passwordUpdateLoading ? 'loading' : ''}`}
                  disabled={passwordUpdateLoading}
                >
                  {passwordUpdateLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
        </div>
      </div>
      )}
    </div>
  );
};

export default Profile;