import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Home.css";
import homeImage from "../assets/homepic-removebg-preview.png"; 
import searchIcon from "../assets/search-icon.png";
import profileIcon from "../assets/profile-icon.png";
import sendIcon from "../assets/send-icon.png";
import employerIcon from "../assets/employer-icon.png";
import ADD from "../assets/add.png";
import linkedin from "../assets/linked-in.png";
import fb from"../assets/facebook.png";
import check from"../assets/check-icon.png";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import '@fortawesome/fontawesome-free/css/all.min.css';

const Home = ({ userRole, darkMode }) => {
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();
  const isEmployer = userRole === "employer";
  const isLoggedIn = !!userRole;

  useEffect(() => {
    const jobsRef = ref(db, "jobs");
    onValue(jobsRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log("Snapshot Data:", snapshot.val()); // Debugging line
        const jobsArray = Object.entries(snapshot.val()).map(([id, job]) => ({
          id,
          ...job,
        }));
        setJobs(jobsArray);
      } else {
        console.log("No data found in Firebase.");
        setJobs([]);
      }
    });
  }, []);

  const handleApplyClick = () => {
    if (isLoggedIn) {
      navigate(`/jobs`);
    } else {
      toast.info("You have to sign up first.", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        onClose: () => {
          Swal.fire({
            title: "Sign Up Required",
            text: "Do you want to sign up now?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Sign Up",
            cancelButtonText: "Cancel",
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/register");
            }
          });
        },
      });
    }
  };
  
  return (
    <div className={darkMode ? "dark-mode" : ""}>
      {/* Hero Section */}
      <section id="hero-section" className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Find Your Next Internship <br />
              or Part-Time Job!
            </h1>
            <p>
              Browse the latest job opportunities, create your profile, <br />
              and start applying today.
            </p>
            {/* Buttons adapt based on user role */}
            <div className="hero-buttons">
              {!isLoggedIn ? (
                <>
                  <Link to="/register" className="btn btn-primary">Sign Up</Link>
                  <Link to="/jobs" className="btn btn-secondary">Browse Jobs</Link>
                </>
              ) : isEmployer ? (
                <>
                  <Link to="/post-job" className="btn btn-primary">Post a Job</Link>
                  <Link to="/dashboard" className="btn btn-secondary">Your Dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
                  <Link to="/dashboard" className="btn btn-secondary">Your Dashboard</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="hero-image">
          <img src={homeImage} alt="Job Search" />
        </div>
      </section>

      {/* Key Features Section */}
      <section className="key-features">
        <h2>Key Features</h2>
        <div className="features-container">
          <div className="Job-card">
            <img src={searchIcon} alt="Job Search" />
            <h3>Job Search Made Easy</h3>
            <p>Find internships and part-time jobs<br /> that fit your skills and interests.</p>
          </div>
          <div className="Profile-card">
            <img src={profileIcon} alt="Profile Icon" />
            <h3>Profile Creation</h3>
            <p>Create your profile in minutes and<br /> upload your resume with ease.</p>
          </div>
          <div className="Quick-card">
            <img src={sendIcon} alt="Sent Icon" />
            <h3>Quick Applications</h3>
            <p>Apply to jobs with a single click and<br /> track your application status.</p>
          </div>
          <div className="Employer-card">
            <img src={employerIcon} alt="employer Icon" />
            <h3>Employer Access</h3>
            <p>Companies can post job listings and<br /> discover top student talent.</p>
          </div>
        </div>
      </section>

     {/* How It Works Section */}
       <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
          <img src={ADD} alt="add acc" />
        <h3>Create Your Profile</h3>
          <p>Get started by creating your professional profile.</p>
          </div>
       <div className="step-card">
       <img src={searchIcon} alt="Browse" />
          <h3>Browse Jobs</h3>
          <p>Explore available opportunities in your field.</p>
      </div>
      <div className="step-card">
      <img src={check} alt="Check" />
          <h3>Apply & Track</h3>
          <p>Submit applications and monitor their status.</p>
       </div>
     </div>
  </section>
   
     {/* Featured Jobs Section - Hide for employers */}
     {!isEmployer && (
      <section id="featured-jobs" className="featured-jobs">
        <h2>Featured Jobs</h2>
        <div className="job-cards">
          {jobs.length > 0 ? (
            jobs.slice(0, 4).map((job) => ( // Limit to the first 4 jobs
              <div key={job.id} className="job-card">
                <h3>{job.title}</h3>
                <p className="company"><span>Company: </span>{job.company}</p>
                <p className="description"><span>Description: </span>
                  {job.description && job.description.length > 150 
                    ? job.description.substring(0, 150) + '...' 
                    : job.description}
                </p>
                <p><span>Location: </span>{job.location}</p>
                {/* Apply Button */}
                <div className="actions">
                  <button className="btn-apply" onClick={handleApplyClick}>
                    {isLoggedIn ? "View Job" : "Apply Now"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-jobs">No jobs available at the moment. Check back soon!</p>
          )}
        </div>
      </section>
     )}


{/* Ready to Get Started Section - Hide for logged-in users */}
{!isLoggedIn && (
  <section className="get-started">
    <h2>Ready to Get Started?</h2>
    <p>Join now to explore opportunities!</p>
    <div className="btn-start">
      <Link to="/register" className="btn-sign">Sign Up</Link>
      <Link to="/login" className="btn-post">Log In</Link>
    </div>
  </section>
)}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h2>StudentJobs</h2>
            <p>Connecting students with opportunities that matter. Build your career path with confidence.</p>
            <div className="footer-social">
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
          
          <div className="footer-links">
            <h3>Quick Links</h3>
            <Link to="/about">About Us</Link>
            <Link to="/jobs">Browse Jobs</Link>
            {isEmployer && <Link to="/post-job">Post Job</Link>}
            {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
            {!isLoggedIn && (
              <>
                <Link to="/register">Sign Up</Link>
                <Link to="/login">Login</Link>
              </>
            )}
          </div>
          
          <div className="footer-links">
            <h3>Support</h3>
            <Link to="/help">Help Center</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
          
          <div className="footer-newsletter">
            <h3>Newsletter</h3>
            <p>Stay updated with the latest job opportunities.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} StudentJobs. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
