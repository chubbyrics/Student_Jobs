import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css"; // Import external CSS
import ProfileSidebar from "./ProfileSidebar";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

const Navbar = ({ userRole, darkMode, toggleDarkMode, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    title: "",
    profilePicture: null
  });
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (userRole) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // Fetch user profile data
          const userRef = ref(db, `users/${user.uid}`);
          onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              setUserProfile({
                name: userData.name || user.displayName || "User",
                email: user.email,
                title: userData.title || userData.role || userRole,
                profilePicture: userData.profilePicture || null
              });
            } else {
              setUserProfile({
                name: user.displayName || "User",
                email: user.email,
                title: userRole,
                profilePicture: null
              });
            }
          });
        }
      });
      
      return () => unsubscribe();
    }
  }, [userRole, auth]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
    }
    setMenuOpen(false);
  };

  const handleJobsClick = (e) => {
    e.preventDefault();
    if (userRole) {
      navigate("/jobs"); // Logged-in users go to Jobs page
    } else {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document.getElementById("featured-jobs")?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      } else {
        document.getElementById("featured-jobs")?.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMenuOpen(false);
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.querySelector(".footer")?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    } else {
      document.querySelector(".footer")?.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const handleLoginClick = () => {
    navigate("/login");
    setMenuOpen(false);
  };

  // Helper function to check if a path is active
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") {
      return true;
    }
    return location.pathname === path;
  };

  // Helper function to determine dashboard path based on user role
  const getDashboardPath = () => {
    return userRole === "employer" ? "/dashboard" : "/dashboard";
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <>
      <nav className={`navbar ${darkMode ? "dark" : "light"}`}>
        <div className="navbar-container">
          {/* Logo Text */}
          <div className="logo">StudentJobs</div>

          {/* Hamburger Menu Icon */}
          <div className="hamburger-menu" onClick={toggleMenu}>
            ☰
          </div>

          {/* Navigation List */}
          <ul className={`nav-list ${menuOpen ? "active" : ""}`}>
            <li>
              <Link 
                to="/" 
                className={`nav-link ${isActive("/") ? "active" : ""}`} 
                onClick={handleHomeClick}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                className={`nav-link ${isActive("/about") ? "active" : ""}`} 
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
            </li>
            <li>
              <Link 
                to="/" 
                className={`nav-link ${isActive("/contact") ? "active" : ""}`} 
                onClick={handleContactClick}
              >
                Contact
              </Link>
            </li>

            {/* Show employer links only when logged in as an employer */}
            {userRole === "employer" && (
              <>
                <li>
                  <Link 
                    to="/post-job" 
                    className={`nav-link ${isActive("/post-job") ? "active" : ""}`} 
                    onClick={() => setMenuOpen(false)}
                  >
                    Post Job
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/dashboard" 
                    className={`nav-link ${isActive("/dashboard") ? "active" : ""}`} 
                    onClick={() => setMenuOpen(false)}
                  >
                    Employer Dashboard
                  </Link>
                </li>
              </>
            )}

            {/* Show student links only when logged in as a student */}
            {userRole === "student" && (
              <>
                <li>
                  <Link 
                    to="/jobs" 
                    className={`nav-link ${isActive("/jobs") ? "active" : ""}`} 
                    onClick={() => setMenuOpen(false)}
                  >
                    Jobs
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/dashboard" 
                    className={`nav-link ${isActive("/dashboard") ? "active" : ""}`} 
                    onClick={() => setMenuOpen(false)}
                  >
                    Student Dashboard
                  </Link>
                </li>
              </>
            )}

            {/* Show profile only when userRole is valid for mobile */}
            {userRole && (
              <li className="mobile-only">
                <Link 
                  to="/profile" 
                  className={`nav-link ${isActive("/profile") ? "active" : ""}`} 
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
              </li>
            )}

            {/* Show Login only when NOT logged in */}
            {!userRole && (
              <>
                <li>
                  <Link 
                    to="/jobs" 
                    className={`nav-link ${isActive("/jobs") ? "active" : ""}`} 
                    onClick={handleJobsClick}
                  >
                    Jobs
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/login" 
                    className={`nav-link ${isActive("/login") ? "active" : ""}`} 
                    onClick={handleLoginClick}
                  >
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Profile Picture (visible only on desktop) */}
          {userRole && (
            <div className="profile-nav-container desktop-only">
              <div className="profile-nav-picture" onClick={toggleSidebar}>
                {userProfile.profilePicture ? (
                  <img src={userProfile.profilePicture} alt="Profile" />
                ) : (
                  <div className="profile-nav-avatar">
                    {userProfile.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button onClick={toggleDarkMode} className="toggle-button">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
        userProfile={userProfile}
        onLogout={onLogout}
      />
    </>
  );
};

export default Navbar;
