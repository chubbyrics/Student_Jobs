import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { ref, push, get } from "firebase/database";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const ApplyJob = () => {
  const { jobId } = useParams(); // Get job ID from URL
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState(null);
  
  const [application, setApplication] = useState({
    name: "",
    email: "",
    resume: "",
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setApplication(prev => ({
          ...prev,
          name: currentUser.displayName || "",
          email: currentUser.email || ""
        }));
      }
    });
    
    return () => unsubscribe();
  }, [auth]);

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      
      try {
        const jobRef = ref(db, `jobs/${jobId}`);
        const snapshot = await get(jobRef);
        
        if (snapshot.exists()) {
          setJobDetails(snapshot.val());
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [jobId]);

  const handleChange = (e) => {
    setApplication({ ...application, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("You must be logged in to apply for jobs");
      navigate("/login");
      return;
    }
    
    if (!jobId) {
      alert("No job selected to apply for");
      return;
    }
    
    try {
      const applicationsRef = ref(db, "applications");
      // Convert to proper format for Firebase
      const applicationData = {
        ...application,
        jobId,
        status: "Pending",
        userId: user.uid,
        // Store timestamps in multiple formats to ensure compatibility
        timestamp: Date.now(),
        appliedAt: new Date().toISOString(),
        // Store both email properties to ensure matches with either approach
        email: application.email.toLowerCase(), // Store lowercase for consistent matching
        userEmail: user.email.toLowerCase(),    // Store lowercase for consistent matching
        userDisplayName: user.displayName
      };
      
      console.log("Current user:", user);
      console.log("Submitting application:", applicationData);
      
      // Push to Firebase
      await push(applicationsRef, applicationData);
      
      alert("Application submitted successfully!");
      navigate("/student-dashboard"); // Redirect to student dashboard after submission
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="apply-job-container">
      <h2>Apply for Job</h2>
      {jobDetails && (
        <div className="job-info">
          <h3>{jobDetails.title}</h3>
          <p><strong>Company:</strong> {jobDetails.company}</p>
          <p><strong>Location:</strong> {jobDetails.location}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="application-form">
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input 
            id="name"
            type="text" 
            name="name" 
            placeholder="Your Name" 
            value={application.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Your Email</label>
          <input 
            id="email"
            type="email" 
            name="email" 
            placeholder="Your Email" 
            value={application.email} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="resume">Your Resume</label>
          <textarea 
            id="resume"
            name="resume" 
            placeholder="Paste your resume or write about your experience here" 
            value={application.resume} 
            onChange={handleChange} 
            required 
            rows={10}
          />
        </div>
        
        <button type="submit" className="submit-button">Submit Application</button>
      </form>
    </div>
  );
};

export default ApplyJob;
