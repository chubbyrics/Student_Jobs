import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { db } from "./firebaseConfig";
import { ref, get } from "firebase/database";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import PostJob from "./pages/PostJob";
import EmployerDashboard from "./pages/EmployerDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import ApplyForm from "./components/ApplyForm";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Set persistence to local (survive browser restarts)
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Firebase persistence set to LOCAL");
      })
      .catch((error) => {
        console.error("Error setting persistence:", error);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthInitialized(true);
      
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const role = snapshot.val().role;
          setUserRole(role);
          localStorage.setItem("userRole", role);

          if (!sessionStorage.getItem("hasGreeted")) {
            toast.success(`Welcome back, ${snapshot.val().name || "User"}!`, {
              position: "top-center",
              autoClose: 1000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: false,
              theme: darkMode ? "dark" : "light",
            });
            sessionStorage.setItem("hasGreeted", "true");
          }
        }
      } else {
        setUserRole(null);
        localStorage.removeItem("userRole");
        sessionStorage.removeItem("hasGreeted");
      }
    });

    return () => unsubscribe();
  }, [darkMode]);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", newMode);
      document.body.classList.toggle("dark-mode", newMode);
      
      // Use toastId to prevent duplicate toasts
      toast.info(newMode ? "Dark mode enabled" : "Light mode enabled", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        theme: newMode ? "dark" : "light",
        toastId: "theme-toggle" // This ensures only one toast with this ID can exist at a time
      });
      
      return newMode;
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, log me out!",
    }).then((result) => {
      if (result.isConfirmed) {
        const auth = getAuth();
        auth.signOut().then(() => {
          toast.success("Logged out successfully!", {
            position: "top-center",
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
            theme: darkMode ? "dark" : "light",
          });
          setUserRole(null);
          sessionStorage.removeItem("hasGreeted");
        });
      }
    });
  };

  return (
    <Router>
      <Navbar userRole={userRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={handleLogout} />

      {authInitialized ? (
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home userRole={userRole} darkMode={darkMode} />} />
          <Route path="/about" element={<About />} />
          <Route path="/jobs" element={<Jobs />} />
          
          {/* Protected employer routes */}
          <Route path="/post-job" element={
            <ProtectedRoute 
              isAuthenticated={!!userRole} 
              userRole={userRole} 
              allowedRoles={["employer"]}
              useUnauthorizedPage={true}
            >
              <PostJob />
            </ProtectedRoute>
          } />
          
          {/* Protected dashboard route */}
          <Route path="/dashboard" element={
            <ProtectedRoute 
              isAuthenticated={!!userRole} 
              userRole={userRole}
              useUnauthorizedPage={true}
            >
              {userRole === "employer" ? <EmployerDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } />
          
          {/* Protected profile route */}
          <Route path="/profile" element={
            <ProtectedRoute 
              isAuthenticated={!!userRole} 
              userRole={userRole}
              useUnauthorizedPage={true}
            >
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Protected application form */}
          <Route path="/apply/:jobId" element={
            <ProtectedRoute 
              isAuthenticated={!!userRole} 
              userRole={userRole} 
              allowedRoles={["student"]}
              useUnauthorizedPage={true}
            >
              <ApplyForm />
            </ProtectedRoute>
          } />
          
          {/* Authentication routes - redirect if already logged in */}
          <Route path="/login" element={
            userRole ? <Navigate to="/" /> : <Login setUserRole={setUserRole} darkMode={darkMode} />
          } />
          <Route path="/register" element={
            userRole ? <Navigate to="/" /> : <Register darkMode={darkMode} />
          } />
          
          {/* Catch-all route for unknown paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <div className="loading-container global-loading">
          <div className="loading-spinner"></div>
          <p>Loading application...</p>
        </div>
      )}

      <ToastContainer />
    </Router>
  );
}

export default App;
