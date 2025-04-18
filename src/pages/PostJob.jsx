import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { ref, push, set } from "firebase/database";
import { getAuth } from "firebase/auth";
import "../styles/PostJob.css";

const PostJob = () => {
  const [job, setJob] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    requirements: "",
    salary: "",
    category: "tech", // Default category
  });

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const formatText = (text) => {
    return text
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const auth = getAuth();
    const employerId = auth.currentUser?.uid; // Get the employer's Firebase UID
  
    if (!employerId) {
      alert("Error: Employer not logged in.");
      return;
    }
  
    try {
      const jobsRef = ref(db, "jobs");
      const newJobRef = push(jobsRef);
      const jobId = newJobRef.key;
  
      const formattedJob = {
        id: jobId,
        title: formatText(job.title),
        company: formatText(job.company),
        description: job.description.trim(),
        location: formatText(job.location),
        requirements: job.requirements.trim(),
        salary: job.salary ? parseFloat(job.salary) : "Negotiable",
        employerId: employerId,
        category: job.category,
      };
  
      await set(newJobRef, formattedJob);
  
      alert("Job posted successfully!");
      setJob({ 
        title: "", 
        company: "", 
        description: "", 
        location: "", 
        requirements: "", 
        salary: "",
        category: "tech" 
      });
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Failed to post job. Please try again.");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Post a Job</h2>
        
        <form onSubmit={handleSubmit} className="form-container">
          {/* Left Column - Job Details */}
          <div className="left-column">
            <div className="form-group">
              <input
                type="text"
                id="jobTitle"
                name="title"
                placeholder="Job Title"
                value={job.title}
                onChange={handleChange}
                required
                className="input"
                aria-label="Job Title"
              />
            </div>
            
            <div className="form-group">
              <input
                type="text"
                id="companyName"
                name="company"
                placeholder="Company Name"
                value={job.company}
                onChange={handleChange}
                required
                className="input"
                aria-label="Company Name"
              />
            </div>
            
            <div className="category-container">
              <label htmlFor="category" className="category-label">Job Category</label>
              <select
                name="category"
                id="category"
                value={job.category}
                onChange={handleChange}
                required
                className="category-select"
              >
                <option value="tech">Tech</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <textarea
                id="jobDescription"
                name="description"
                placeholder="Job Description"
                value={job.description}
                onChange={handleChange}
                required
                className="textarea"
                aria-label="Job Description"
              />
            </div>
            
            <div className="form-group">
              <input
                type="text"
                id="jobLocation"
                name="location"
                placeholder="Location"
                value={job.location}
                onChange={handleChange}
                required
                className="input"
                aria-label="Job Location"
              />
            </div>
          </div>

          {/* Middle Gap */}
          <div className="middle-gap"></div>

          {/* Right Column - Requirements & Salary */}
          <div className="right-column">
            <div className="requirements">
              <h3>Job Requirements</h3>
              <textarea
                id="jobRequirements"
                name="requirements"
                placeholder="Job Requirements"
                value={job.requirements}
                onChange={handleChange}
                required
                className="textarea"
                aria-label="Job Requirements"
              />
            </div>
            
            <div className="salary">
              <h3>Salary</h3>
              <input
                type="number"
                id="jobSalary"
                name="salary"
                placeholder="Salary (Optional)"
                value={job.salary}
                onChange={handleChange}
                className="input"
                aria-label="Job Salary"
              />
            </div>
          </div>

          {/* Submit Button Below Both Columns */}
          <div className="button-container">
            <button type="submit" className="button">Post Job</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
