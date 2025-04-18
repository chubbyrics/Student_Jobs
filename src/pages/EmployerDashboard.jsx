import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import emailjs from "emailjs-com";
import { useNavigate } from "react-router-dom";
import "../styles/Employer.css";

// Redirect notification component
const RedirectNotification = ({ message }) => {
  return (
    <div className="redirect-message">
      {message}
    </div>
  );
};

const EmployerDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [jobPosts, setJobPosts] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [cancelAppId, setCancelAppId] = useState(null);
  const [hireAppId, setHireAppId] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState({ date: "", message: "" });
  const [dateError, setDateError] = useState("");
  const [redirectMessage, setRedirectMessage] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  
  const navigate = useNavigate();
  const auth = getAuth();
  const employerId = auth.currentUser?.uid;

  useEffect(() => {
    if (!employerId) return;

    const jobsRef = ref(db, "jobs");
    onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employerJobs = Object.entries(data)
          .map(([id, job]) => ({ id, ...job }))
          .filter((job) => job.employerId === employerId);

        setJobPosts(employerJobs);
      }
    });
  }, [employerId]);

  useEffect(() => {
    if (jobPosts.length === 0) return;

    const applicationsRef = ref(db, "applications");
    onValue(applicationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const jobMap = jobPosts.reduce((acc, job) => {
          acc[job.id] = job.title;
          return acc;
        }, {});

        const filteredApplications = Object.entries(data)
          .map(([id, app]) => ({
            id,
            ...app,
            jobTitle: jobMap[app.jobId] || "Unknown Position",
          }))
          .filter((app) => jobMap[app.jobId]);

        setApplications(filteredApplications);
        
        // Calculate statistics
        const totalApps = filteredApplications.length;
        const pendingApps = filteredApplications.filter(app => !app.status || app.status === "Pending").length;
        const acceptedApps = filteredApplications.filter(app => app.status === "Accepted").length;
        const rejectedApps = filteredApplications.filter(app => app.status === "Rejected").length;
        
        setStats({
          total: totalApps,
          pending: pendingApps,
          accepted: acceptedApps,
          rejected: rejectedApps
        });
      }
    });
  }, [jobPosts]);

  const generateMeetLink = () => {
    const randomString = Math.random().toString(36).substring(2, 10);
    return `https://meet.google.com/${randomString}`;
  };
  
  const handleAcceptClick = (app) => {
    setSelectedApp(app);
    setShowModal(true);
    setDateError("");
  
    const meetLink = generateMeetLink();
    setInterviewDetails({
      date: "",
      message: `Here is your interview link: ${meetLink}`,
    });
  };
  
  const handleStatusUpdate = (appId, newStatus) => {
    const applicationRef = ref(db, `applications/${appId}`);
    update(applicationRef, { status: newStatus })
      .then(() => {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === appId ? { ...app, status: newStatus } : app
          )
        );
        
        // Update statistics after status change
        const updatedApps = applications.map(app => 
          app.id === appId ? { ...app, status: newStatus } : app
        );
        
        const totalApps = updatedApps.length;
        const pendingApps = updatedApps.filter(app => !app.status || app.status === "Pending").length;
        const acceptedApps = updatedApps.filter(app => app.status === "Accepted").length;
        const rejectedApps = updatedApps.filter(app => app.status === "Rejected").length;
        
        setStats({
          total: totalApps,
          pending: pendingApps,
          accepted: acceptedApps,
          rejected: rejectedApps
        });
        
        // Show notification when application is rejected
        if (newStatus === "Rejected") {
          setRedirectMessage("Application rejected.");
          setTimeout(() => {
            setRedirectMessage(null);
          }, 3000);
        }
      })
      .catch((error) => console.error("Error updating application:", error));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!interviewDetails.date) {
      setDateError("Please select a date and time for the interview");
      return;
    }
    
    setDateError("");
  
    if (!selectedApp || !selectedApp.email) {
      console.error("No recipient email found.");
      return;
    }
  
    // Format the date for better display
    const formattedDate = new Date(interviewDetails.date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  
    const emailParams = {
      to_email: selectedApp.email, 
      from_name: selectedApp.name, 
      company: selectedApp.company, 
      date: formattedDate, 
      message: `Dear ${selectedApp.name},\n\nYou have been invited for an interview for the position of ${selectedApp.jobTitle} at ${selectedApp.company}.\n\nDate & Time: ${formattedDate}\n\n${interviewDetails.message}\n\nBest regards,\n${selectedApp.jobTitle}`,
    };
    
    // Save interview date to application with formatted date for display
    const applicationRef = ref(db, `applications/${selectedApp.id}`);
    update(applicationRef, { 
      status: "Accepted",
      interviewDate: formattedDate,
      interviewRawDate: interviewDetails.date, // Save raw date for potential sorting/comparison
      interviewMessage: interviewDetails.message
    })
    .then(() => {
      // Send email
      emailjs.send(
        "service_1kbnub9", 
        "template_2ejejwl", 
        emailParams,
        "S4SyvUdha2fv1eq1T" 
      )
      .then(
        (response) => {
          console.log("Email sent successfully:", response.status, response.text);
          setShowModal(false);
          setInterviewDetails({ date: "", message: "" });
          
          // Redirect to jobs page after successful interview scheduling
          setRedirectMessage("Interview invitation sent! Redirecting to jobs page...");
          setTimeout(() => {
            navigate("/jobs");
          }, 1500);
        },
        (error) => {
          console.error("Failed to send email:", error);
        }
      );
    })
    .catch((error) => {
      console.error("Error updating application with interview details:", error);
    });
  };

  const handleCancelInterview = (appId) => {
    setCancelAppId(appId);
    setShowCancelModal(true);
  };
  
  const confirmCancelInterview = () => {
    if (!cancelAppId) return;
    
    const applicationRef = ref(db, `applications/${cancelAppId}`);
    update(applicationRef, { 
      status: "Pending",
      interviewDate: null,
      interviewRawDate: null,
      interviewMessage: null
    })
    .then(() => {
      setShowCancelModal(false);
      
      // Update statistics and application list
      setApplications(prev => 
        prev.map(app => 
          app.id === cancelAppId 
            ? { ...app, status: "Pending", interviewDate: null, interviewRawDate: null, interviewMessage: null }
            : app
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending + 1,
        accepted: prev.accepted - 1
      }));
      
      setRedirectMessage("Interview cancelled successfully.");
      setTimeout(() => {
        setRedirectMessage(null);
      }, 3000);
    })
    .catch(error => {
      console.error("Error cancelling interview:", error);
    });
  };

  const handleHireClick = (appId) => {
    setHireAppId(appId);
    setShowHireModal(true);
  };
  
  const confirmHire = () => {
    if (!hireAppId) return;
    
    const applicationRef = ref(db, `applications/${hireAppId}`);
    const application = applications.find(app => app.id === hireAppId);
    
    update(applicationRef, { 
      status: "Hired",
      hiredDate: new Date().toISOString()
    })
    .then(() => {
      setShowHireModal(false);
      
      // Update application list
      setApplications(prev => 
        prev.map(app => 
          app.id === hireAppId 
            ? { ...app, status: "Hired", hiredDate: new Date().toISOString() }
            : app
        )
      );
      
      // Send email notification
      if (application && application.email) {
        const emailParams = {
          to_email: application.email, 
          from_name: application.name, 
          company: application.company, 
          position: application.jobTitle,
          message: `Dear ${application.name},\n\nCongratulations! You have been hired for the position of ${application.jobTitle} at ${application.company}.\n\nWe will contact you soon with more details about your onboarding process.\n\nBest regards,\n${application.company} Team`,
        };
        
        emailjs.send(
          "service_1kbnub9", 
          "template_2ejejwl", 
          emailParams,
          "S4SyvUdha2fv1eq1T" 
        )
        .then(
          (response) => {
            console.log("Hire notification sent successfully:", response.status, response.text);
            setRedirectMessage("Candidate has been hired! Notification sent.");
            setTimeout(() => {
              setRedirectMessage(null);
            }, 3000);
          },
          (error) => {
            console.error("Failed to send hire notification:", error);
            setRedirectMessage("Candidate has been hired, but notification failed to send.");
            setTimeout(() => {
              setRedirectMessage(null);
            }, 3000);
          }
        );
      } else {
        setRedirectMessage("Candidate has been hired!");
        setTimeout(() => {
          setRedirectMessage(null);
        }, 3000);
      }
    })
    .catch(error => {
      console.error("Error hiring candidate:", error);
    });
  };

  return (
    <div className="employer-dashboard-container">
      <h2 className="page-title">Employer Dashboard</h2>
      
      {/* Dashboard Statistics */}
      <div className="dashboard-stats">
        <div className="stat-card applications">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card accepted">
          <div className="stat-number">{stats.accepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Job Applications Section */}
        <div className="applications-container">
          <div className="section-header">
            <h3 className="section-title">Job Applications</h3>
          </div>
          
          {applications.length > 0 && (
            <h4 className="job-title">{applications[0].jobTitle}</h4>
          )}

          <div className="applications-list">
            {applications.length > 0 ? (
              applications.map((app) => (
                <div key={app.id} className="application-card">
                  <div className="application-header">
                    <h3>{app.name}</h3>
                    <span className={`status-badge status-${app.status ? app.status.toLowerCase() : 'pending'}`}>
                      {app.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="application-info">
                    <p><span className="label">Email:</span> {app.email}</p>
                    <p><span className="label">Job Position:</span> {app.jobTitle}</p>
                    <a href={app.resume} target="_blank" rel="noopener noreferrer">
                      <span>View Resume</span>
                    </a>
                  </div>
                  
                  <div className="button-group">
                    {app.status !== "Hired" && (
                      <>
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptClick(app)}
                          disabled={app.status === "Accepted" || app.status === "Rejected"}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleStatusUpdate(app.id, "Rejected")}
                          disabled={app.status === "Accepted" || app.status === "Rejected"}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === "Hired" && (
                      <div className="hired-status-message">
                        Candidate has been hired
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No applications received yet.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Interviews Section */}
        <div className="interview-section">
          <h3>Upcoming Interviews</h3>
          
          <div className="interviews-list">
            {applications.filter(app => app.status === "Accepted").length > 0 ? (
              applications
                .filter(app => app.status === "Accepted")
                .map(app => (
                  <div key={app.id} className="interview-card">
                    <h4>{app.name}</h4>
                    <p><span className="label">Position:</span> {app.jobTitle}</p>
                    <p><span className="label">Email:</span> {app.email}</p>
                    {app.interviewDate ? (
                      <p className="interview-date"><span className="label">Interview:</span> {app.interviewDate}</p>
                    ) : (
                      <p className="interview-date missing"><span className="label">Interview:</span> Not scheduled</p>
                    )}
                    {app.interviewMessage && (
                      <div className="interview-details">
                        <p><span className="label">Details:</span></p>
                        <p className="interview-message">{app.interviewMessage}</p>
                      </div>
                    )}
                    <div className="interview-actions">
                      <button 
                        className="cancel-interview-btn" 
                        onClick={() => handleCancelInterview(app.id)}
                      >
                        Cancel Interview
                      </button>
                      <button 
                        className="hire-btn" 
                        onClick={() => handleHireClick(app.id)}
                      >
                        Hire Candidate
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="no-data-message">
                <p>No upcoming interviews scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interview Scheduling Modal */}
      {showModal && (
        <div className="modal-container">
          <div className="modal-overlay" onClick={() => setShowModal(false)}></div>
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            <h2 className="modal-title">Schedule Interview</h2>
            <form className="modal-form">
              <label>Date & Time <span className="required">*</span></label>
              <input
                type="datetime-local"
                value={interviewDetails.date}
                onChange={(e) => setInterviewDetails({ ...interviewDetails, date: e.target.value })}
                required
                className={dateError ? "error" : ""}
              />
              {dateError && <p className="error-message">{dateError}</p>}
              
              <label>Additional Details</label>
              <textarea
                value={interviewDetails.message}
                onChange={(e) => setInterviewDetails({ ...interviewDetails, message: e.target.value })}
                placeholder="Enter interview details, meeting link, and any other instructions..."
              />
              <button className="modal-submit-btn" onClick={handleSubmit}>Send Invitation</button>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Interview Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-container">
          <div className="modal-overlay" onClick={() => setShowCancelModal(false)}></div>
          <div className="modal-content confirm-modal">
            <button className="modal-close-btn" onClick={() => setShowCancelModal(false)}>×</button>
            <h2 className="modal-title">Cancel Interview</h2>
            <p className="confirm-message">Are you sure you want to cancel this interview? The application will be moved back to pending status.</p>
            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowCancelModal(false)}>No, Keep Interview</button>
              <button className="confirm-btn" onClick={confirmCancelInterview}>Yes, Cancel Interview</button>
            </div>
          </div>
        </div>
      )}

      {/* Hire Confirmation Modal */}
      {showHireModal && (
        <div className="modal-container">
          <div className="modal-overlay" onClick={() => setShowHireModal(false)}></div>
          <div className="modal-content confirm-modal">
            <button className="modal-close-btn" onClick={() => setShowHireModal(false)}>×</button>
            <h2 className="modal-title">Hire Candidate</h2>
            <p className="confirm-message">Are you sure you want to hire this candidate?</p>
            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setShowHireModal(false)}>No, Keep Application</button>
              <button className="confirm-btn" onClick={confirmHire}>Yes, Hire Candidate</button>
            </div>
          </div>
        </div>
      )}

      {/* Redirect Notification */}
      {redirectMessage && <RedirectNotification message={redirectMessage} />}
    </div>
  );
};

export default EmployerDashboard;
