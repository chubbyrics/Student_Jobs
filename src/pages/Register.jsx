import React, { useState, useEffect, useRef } from "react";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signOut } from "firebase/auth";
import { db } from "../firebaseConfig";
import { ref, set } from "firebase/database";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { toast } from "react-toastify";
import "../styles/Register.css";
import mascotImage from "../assets/SJ_mascot.png";

const Register = ({ darkMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("select");
  const [loading, setLoading] = useState(false);
  const [eyePosition, setEyePosition] = useState({ leftX: 0, leftY: 0, rightX: 0, rightY: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");
  const mascotRef = useRef(null);

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Password validation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long");
      return;
    }

    // Role validation
    if (role === "select") {
      setError("Please select either Student or Employer.");
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        setError("Email already in use. Please use a different email.");
        setLoading(false);
        return;
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user info in database
      await set(ref(db, `users/${user.uid}`), {
        userID: user.uid,
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
      });
      
      // Sign out the user to ensure they need to explicitly log in after registration
      await signOut(auth);

      toast.success("Registration successful! Please log in.", {
        position: "top-center",
        autoClose: 2000,
      });
      
      navigate("/login", { state: { fromRegister: true } });
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.code === "auth/email-already-in-use" 
          ? "Email already in use. Please use a different email."
          : error.code === "auth/invalid-email"
          ? "Invalid email format."
          : error.code === "auth/weak-password"
          ? "Password is too weak. Please use a stronger password."
          : "An error occurred during registration. Please try again."
      );
    }

    setLoading(false);
  };

  return (
    <div className={`register-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="mascot-text">
        <h3>Welcome to Student Jobs!<br/>I'm SJ, here to help you.</h3>
      </div>
      <div className="mascot-container" ref={mascotRef}>
        <img src={mascotImage} alt="Mascot" className="mascot-image" />
        <div className="eye left-eye" style={{ transform: `translate(${eyePosition.leftX}px, ${eyePosition.leftY}px)` }} />
        <div className="eye right-eye" style={{ transform: `translate(${eyePosition.rightX}px, ${eyePosition.rightY}px)` }} />
      </div>

      <div className="register-container">
        <div className="register-card">
          <h2 className="register-title">Sign Up</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleRegister} className="register-form">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="register-input" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="register-input" />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="register-input" />

            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className={`register-select ${role === "select" ? "placeholder-select" : ""}`}
            >
              <option value="select">Select your role</option>
              <option value="student">Student</option>
              <option value="employer">Employer</option>
            </select>

            <button type="submit" className={`register-button ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>

            <p className="login-text">Already have an account? <Link to="/login" className="login-link">Login here</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;