import React, { useState, useEffect, useRef } from "react";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { db } from "../firebaseConfig";
import { ref, get } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import "../styles/Login.css";
import mascotImage from "../assets/SJ_mascot.png";

const Login = ({ setUserRole, darkMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [eyePosition, setEyePosition] = useState({ leftX: 0, leftY: 0, rightX: 0, rightY: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const mascotRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    // Check for registration success from state
    if (location.state && location.state.fromRegister) {
      setSuccessMessage("Registration successful! Please log in with your new account.");
    }
    
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [location]);

  useEffect(() => {
    // Check for remembered email
    const rememberedEmail = localStorage.getItem("rememberMe");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    const handleMouseMove = (event) => {
      if (mascotRef.current && !isMobile) {
        const { clientX, clientY } = event;
        const mascotRect = mascotRef.current.getBoundingClientRect();
        const mascotCenterX = mascotRect.left + mascotRect.width / 2;
        const mascotCenterY = mascotRect.top + mascotRect.height / 2;
        
        // Calculate the position relative to mascot center
        const offsetX = (clientX - mascotCenterX) / 50;
        const offsetY = (clientY - mascotCenterY) / 50;
        
        // Limit the movement
        const limitedX = Math.max(-3, Math.min(3, offsetX));
        const limitedY = Math.max(-3, Math.min(3, offsetY));
        
        setEyePosition({ 
          leftX: limitedX, 
          leftY: limitedY, 
          rightX: limitedX, 
          rightY: limitedY 
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Set persistence to local first
      await setPersistence(auth, browserLocalPersistence);
      
      // Then sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        localStorage.setItem("userRole", userData.role);
        
        // Remember email if checked
        if (rememberMe) {
          localStorage.setItem("rememberMe", email);
        } else {
          localStorage.removeItem("rememberMe");
        }
        
        setUserRole(userData.role);
        navigate("/");
      } else {
        setError("User data not found!");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.code === "auth/invalid-credential" 
          ? "Invalid email or password" 
          : "An error occurred during login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${darkMode ? "dark-mode" : ""}`}>
      {/* Mascot */}
      <div className="mascot-text">
        <h3>Welcome back!<br/>I'm SJ, glad to see you again.</h3>
      </div>
      <div className="mascot-container" ref={mascotRef}>
        <img src={mascotImage} alt="Mascot" className="mascot-image" />
        <div className="eye left-eye" style={{ transform: `translate(${eyePosition.leftX}px, ${eyePosition.leftY}px)` }} />
        <div className="eye right-eye" style={{ transform: `translate(${eyePosition.rightX}px, ${eyePosition.rightY}px)` }} />
      </div>

      {/* Login Form */}
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Sign In</h2>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          <form onSubmit={handleLogin} className="login-form">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="login-input" 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="login-input" 
            />
            <div className="remember-me">
              <label>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                Remember me
              </label>
            </div>
            <button 
              type="submit" 
              className={`login-button ${loading ? 'loading' : ''}`} 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="login-footer">
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
