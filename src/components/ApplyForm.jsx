import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig"; 
import { ref, push } from "firebase/database";
import { validateFile, uploadToCloudinary } from "../services/imageUploadService";
import "../styles/Applyform.css";

const ApplyForm = () => {
  const { jobId } = useParams();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    resume: null,
  });
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError("");
    
    if (file) {
      // Validate resume file (can be PDF, DOC, DOCX as well as images)
      const validation = validateFile(file, {
        allowedTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        maxSizeMB: 10 // Allow larger files for resumes
      });

      if (!validation.success) {
        setUploadError(validation.error);
        return;
      }
      
      setFormData((prevData) => ({
        ...prevData,
        resume: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.resume) {
      setUploadError("Please upload a resume.");
      return;
    }
    
    setIsSubmitting(true);
    setUploadError("");
  
    try {
      // Upload resume to Cloudinary
      const resumeUrl = await uploadToCloudinary(formData.resume);
  
      // Save the application data
      const applicationData = {
        name: formData.fullName,
        email: formData.email,
        resume: resumeUrl,
        jobId: jobId,
        status: "Pending ⏳",
        appliedAt: new Date().toISOString()
      };
  
      await push(ref(db, "applications"), applicationData);
  
      alert("Application submitted successfully!");
      setFormData({ fullName: "", email: "", resume: null });
    } catch (error) {
      console.error("Error submitting application:", error);
      setUploadError("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="apply-form-wrapper">
      <div className="apply-form-container">
        <h2 className="apply-form-header">Apply for Job</h2>
        {uploadError && <div className="error-message">{uploadError}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Full Name:
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            Resume:
            <input type="file" onChange={handleFileChange} required={!formData.resume} />
            <small className="file-info">Supports PDF, DOC, DOCX, and image formats (max 10MB)</small>
          </label>
          <br />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyForm;
