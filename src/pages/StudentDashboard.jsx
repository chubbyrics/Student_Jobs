import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import "../styles/Student.css";

const StudentDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    hired: 0,
  });
  
  const [user, setUser] = useState(null);
  const auth = getAuth();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, [auth]);

  // Fetch applications data when user is available
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const studentEmail = user.email;
    const studentId = user.uid;
    
    console.log("Fetching applications for:", studentId, studentEmail);

    // Fetch all applications
    const applicationsRef = ref(db, "applications");
    const jobsRef = ref(db, "jobs");
    
    // First get all jobs
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Get jobs data
        const jobsSnapshot = await get(jobsRef);
        const jobData = jobsSnapshot.exists() ? jobsSnapshot.val() : {};
        
        // Get applications data
        onValue(applicationsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("Applications data:", data);
            console.log("Current user email:", studentEmail);
            console.log("Current user ID:", studentId);
            
            const studentApplications = Object.entries(data)
              .map(([id, app]) => ({ id, ...app }))
              .filter((app) => {
                // Filter by userId (preferred) or by email as fallback with case-insensitive comparison
                const matchesId = studentId && app.userId === studentId;
                const matchesEmail = app.email && studentEmail && 
                                    app.email.toLowerCase() === studentEmail.toLowerCase();
                console.log("App:", app, "Matches ID:", matchesId, "Matches Email:", matchesEmail);
                return matchesId || matchesEmail;
              });
            
            console.log("Filtered applications:", studentApplications);
            
            if (studentApplications.length > 0) {
              // Add job details to applications
              const enhancedApplications = studentApplications.map((app) => {
                const jobInfo = jobData[app.jobId];
                let formattedDate = "Unknown";
                
                // Handle different timestamp formats
                try {
                  if (app.timestamp) {
                    formattedDate = new Date(Number(app.timestamp)).toLocaleDateString();
                  } else if (app.appliedAt) {
                    formattedDate = new Date(app.appliedAt).toLocaleDateString();
                  }
                  console.log("Original timestamp:", app.timestamp || app.appliedAt, "Formatted date:", formattedDate);
                } catch (error) {
                  console.error("Error formatting date:", error);
                }
                
                return {
                  ...app,
                  jobTitle: jobInfo?.title || "Unknown Position",
                  company: jobInfo?.company || "Unknown Company",
                  location: jobInfo?.location || "Remote",
                  date: formattedDate,
                };
              });
              
              // Sort by date (newest first)
              enhancedApplications.sort((a, b) => {
                return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
              });
              
              // Calculate stats based on status
              const statsSummary = {
                total: enhancedApplications.length,
                pending: enhancedApplications.filter(app => app.status === "Pending").length,
                accepted: enhancedApplications.filter(app => app.status === "Accepted").length,
                rejected: enhancedApplications.filter(app => app.status === "Rejected").length,
                hired: enhancedApplications.filter(app => app.status === "Hired").length,
              };
              
              setApplications(enhancedApplications);
              setStats(statsSummary);
              console.log("Set applications:", enhancedApplications);
            } else {
              setApplications([]);
              setStats({
                total: 0,
                pending: 0,
                accepted: 0,
                rejected: 0,
                hired: 0,
              });
            }
          } else {
            setApplications([]);
            setStats({
              total: 0,
              pending: 0,
              accepted: 0,
              rejected: 0,
              hired: 0,
            });
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted": return "var(--status-accepted, #34d399)";
      case "Rejected": return "var(--status-rejected, #ef4444)";
      case "Pending": return "var(--status-pending, #f59e0b)";
      case "Hired": return "var(--status-hired, #3b82f6)";
      default: return "var(--text-secondary, #64748b)";
    }
  };
  
  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Accepted": return "✓";
      case "Rejected": return "✗";
      case "Pending": return "⏳";
      case "Hired": return "🎉";
      default: return "?";
    }
  };

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Your Dashboard</h1>
          <p>Welcome back, {user?.displayName || "Student"}</p>
        </div>
      </header>

      <div className="dashboard-statistics">
        <div className="stat-card total">
          <h3>{stats.total}</h3>
          <p>Total Applications</p>
        </div>
        <div className="stat-card pending">
          <h3>{stats.pending}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card accepted">
          <h3>{stats.accepted}</h3>
          <p>Accepted</p>
        </div>
        <div className="stat-card rejected">
          <h3>{stats.rejected}</h3>
          <p>Rejected</p>
        </div>
        <div className="stat-card hired">
          <h3>{stats.hired}</h3>
          <p>Hired</p>
        </div>
      </div>

      <section className="applications-section">
        <div className="section-header">
          <h2>Your Job Applications</h2>
          <Link to="/jobs" className="browse-jobs-btn">Browse Jobs</Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your applications...</p>
          </div>
        ) : applications.length > 0 ? (
          <div className="applications-list">
            {applications.map((app) => (
              <div key={app.id} className="application-card">
                <div className="application-header">
                  <h3 className="job-title">{app.jobTitle}</h3>
                  <div 
                    className="application-status" 
                    style={{ backgroundColor: getStatusColor(app.status) }}
                  >
                    <span className="status-icon">{getStatusIcon(app.status)}</span>
                    {app.status}
                  </div>
                </div>
                <div className="application-details">
                  <div className="detail-group">
                    <span className="detail-label">Company</span>
                    <span className="detail-value">{app.company}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{app.location}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Applied On</span>
                    <span className="detail-value">{app.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Applications Yet</h3>
            <p>You haven't applied to any jobs yet. Start exploring opportunities!</p>
            <Link to="/jobs" className="primary-button">Find Jobs</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
