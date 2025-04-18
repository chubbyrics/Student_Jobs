import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue, set, push } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Jobs.css";
import sendIcon from "../assets/send-icon.png";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [topCompanies, setTopCompanies] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [ratingCounts, setRatingCounts] = useState({});
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showReviews, setShowReviews] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    // Check if the screen is mobile-sized
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const jobsRef = ref(db, "jobs");
    const reviewsRef = ref(db, "reviews");
    const ratingsRef = ref(db, "ratings");

    // Fetch jobs data from Firebase
    onValue(jobsRef, (snapshot) => {
      if (snapshot.exists()) {
        const jobsData = snapshot.val();
        const jobsArray = Object.entries(jobsData).map(([id, job]) => ({ id, ...job }));
        setJobs(jobsArray);
      } else {
        setJobs([]);
      }
    });

    // Fetch reviews data from Firebase
    onValue(reviewsRef, (snapshot) => {
      if (snapshot.exists()) {
        const reviewsData = snapshot.val();
        const reviewsArray = Object.entries(reviewsData).map(([id, review]) => ({ id, ...review }));
        setReviews(reviewsArray);
      } else {
        setReviews([]);
      }
    });

    // Fetch ratings data from Firebase
    onValue(ratingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const ratingsData = snapshot.val();
        const ratingsMap = {};

        // Collect ratings by job id and user
        Object.entries(ratingsData).forEach(([jobId, ratings]) => {
          ratingsMap[jobId] = {};
          Object.entries(ratings).forEach(([userId, rating]) => {
            if (rating > 0) {
              ratingsMap[jobId][userId] = rating;
            }
          });
        });

        // Set ratings in state
        setSelectedRatings(ratingsMap);

        // Calculate rating counts (distinct users who rated)
        const counts = {};
        Object.entries(ratingsMap).forEach(([jobId, ratings]) => {
          counts[jobId] = Object.keys(ratings).length; // Count unique users
        });
        setRatingCounts(counts);
      }
    });
  }, []);

  // Update the top companies based on ratings
  useEffect(() => {
    const companiesWithRatings = {};

    // Aggregate ratings for each company
    jobs.forEach((job) => {
      let totalRating = 0;
      let ratingCount = 0;

      // Get the job's ratings from the selectedRatings state
      const jobRatings = selectedRatings[job.id] || {};
      Object.values(jobRatings).forEach((rating) => {
        totalRating += rating;
        ratingCount += 1;
      });

      // Only include jobs with ratings
      if (ratingCount > 0) {
        const avgRating = totalRating / ratingCount;
        if (avgRating >= 4) {
          companiesWithRatings[job.company] = companiesWithRatings[job.company] || { totalRating: 0, count: 0 };
          companiesWithRatings[job.company].totalRating += totalRating;
          companiesWithRatings[job.company].count += ratingCount;
        }
      }
    });

    // Sort companies by average rating
    const topCompaniesArray = Object.keys(companiesWithRatings)
      .map((company) => ({
        company,
        avgRating: companiesWithRatings[company].totalRating / companiesWithRatings[company].count,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    setTopCompanies(topCompaniesArray);
  }, [selectedRatings, jobs]);

  // Handle star click for rating
  const handleStarClick = (jobId, index) => {
    // Check if user is logged in
    if (!currentUserId) {
      toast.error("Please log in to rate jobs", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    const currentRating = selectedRatings[jobId] || {};
    const userId = currentUserId; // Use actual user ID
    const newRating = currentRating[userId] === index + 1 ? 0 : index + 1; // Toggle rating: 0 means removed

    // Update the rating in Firebase
    set(ref(db, `ratings/${jobId}/${userId}`), newRating);

    // Update the selected ratings state
    setSelectedRatings((prevRatings) => ({
      ...prevRatings,
      [jobId]: { ...prevRatings[jobId], [userId]: newRating },
    }));
  };

  // Handle comment submission
  const handleSubmitComment = () => {
    // Check if user is logged in
    if (!currentUserId) {
      toast.error("Please log in to submit reviews", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (comment.trim() !== "" && selectedCompany) {
      const newReview = {
        userId: currentUserId,
        user: name.trim() !== "" ? name : "Anonymous",
        company: selectedCompany,
        text: comment,
        timestamp: new Date().toISOString(),
      };
      push(ref(db, "reviews"), newReview);
      setComment("");
      setName("");
      setSelectedCompany("");
      toast.success("Your review has been submitted!", {
        position: "top-center",
        autoClose: 2000,
      });
    } else {
      toast.warning("Please select a company and write a review", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  // Filter jobs based on search and filter
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || job.category === filter;
    return matchesSearch && matchesFilter;
  });

  // Open job details modal
  const openModal = (job) => {
    setSelectedJob(job);
    setModalVisible(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedJob(null);
    // Re-enable scrolling when modal is closed
    document.body.style.overflow = 'auto';
  };

  // Toggle community reviews visibility (for mobile)
  const toggleReviews = () => {
    setShowReviews(!showReviews);
  };

  // Handle apply button click
  const handleApplyClick = (jobId) => {
    if (!currentUserId) {
      toast.error("Please log in to apply for jobs", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }
    
    // Check if user has the student role (will need to be verified in the ProtectedRoute component)
    navigate(`/apply/${jobId}`);
  };

  // Render the community reviews section
  const renderReviews = () => {
    return (
      <div className={`reviews-section ${isMobile && showReviews ? 'mobile-visible' : ''} ${isMobile && !showReviews ? 'mobile-hidden' : ''}`}>
        <h3 className="reviews-title">Community Reviews</h3>
        {isMobile && (
          <button className="close-reviews-btn" onClick={toggleReviews}>×</button>
        )}
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} className="review-card">
              <div className="review-header">
                <span className="review-user">{review.user}</span>
                <span className="review-company"> - {review.company}</span>
              </div>
              <p className="review-text">"{review.text}"</p>
            </div>
          ))
        ) : (
          <p className="no-reviews">No reviews yet. Be the first to share your experience!</p>
        )}
        <div className="review-form">
          {!currentUserId && (
            <div className="auth-message">
              Please <Link to="/login" className="auth-link">log in</Link> to submit reviews
            </div>
          )}
          <input
            type="text"
            placeholder="Your Name (or leave blank for Anonymous)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="name-input"
            disabled={!currentUserId}
          />
          <select 
            className="company-dropdown" 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            disabled={!currentUserId}
          >
            <option value="">Select Company</option>
            {jobs.map((job, index) => (
              job.company && <option key={index} value={job.company}>{job.company}</option>
            ))}
          </select>
          <textarea
            className="comment-box"
            placeholder={currentUserId ? "Write your review..." : "Log in to write a review"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!currentUserId}
          />
          <button 
            className={`submit-button ${!currentUserId ? 'disabled' : ''}`} 
            onClick={handleSubmitComment}
            disabled={!currentUserId}
          >
            <img src={sendIcon} alt="Send" style={{ width: "20px", height: "20px" }} />
            <span style={{ marginLeft: "5px" }}>Submit</span>
          </button>
        </div>
      </div>
    );
  };

  // Modify the Apply button in the job card to use the new handler
  const renderJobCard = (job) => (
    <div key={job.id} className="job-card">
      <h3>{job.title}</h3>
      <p className="company">{job.company}</p>
      <p className="description">
        {job.description.length > 150
          ? job.description.substring(0, 150) + "..."
          : job.description}
      </p>
      <p className="location">{job.location}</p>
      <div className="job-details">
        <span className="salary">${job.salary} / hour</span>
        <span className="category">{job.category}</span>
      </div>
      
      {/* Star Rating System */}
      <div className="rating-container">
        <div className="stars">
          {[...Array(5)].map((_, i) => {
            const jobRatings = selectedRatings[job.id] || {};
            const userRating = currentUserId ? jobRatings[currentUserId] || 0 : 0;
            const filled = i < userRating;
            
            return (
              <span
                key={i}
                className={`star ${filled ? "filled" : ""}`}
                onClick={() => handleStarClick(job.id, i)}
              >
                ★
              </span>
            );
          })}
        </div>
        <span className="rating-count">({ratingCounts[job.id] || 0})</span>
      </div>
      
      <div className="actions">
        <button className="view-details" onClick={() => openModal(job)}>
          View Details
        </button>
        <button 
          className="apply-button" 
          onClick={() => handleApplyClick(job.id)}
        >
          Apply Now
        </button>
      </div>
    </div>
  );

  return (
    <div className="jobs-container">
      {/* Left Column - Top Companies */}
      <div className="sidebar">
        <h3 className="sidebar-title">Top Companies</h3>
        <ul className="company-list">
          {topCompanies.length > 0 ? (
            topCompanies.map((company, index) => (
              <li key={index} className="company-item">
                <span className="company-name">{company.company}</span>
                <span className="company-rating">
                  {company.avgRating.toFixed(1)} <span className="star-icon">★</span>
                </span>
              </li>
            ))
          ) : (
            <p>No top companies.</p>
          )}
        </ul>
      </div>

      {/* Middle Column - Job Listings */}
      <div className="jobs-content">
        <h2 className="jobs-title">Available Jobs</h2>
        <div className="search-filter-container">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
          <select className="filter-dropdown" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="tech">Tech</option>
            <option value="marketing">Marketing</option>
            <option value="design">Design</option>
          </select>
        </div>
        {filteredJobs.length > 0 ? (
          <div className="jobs-list">
            {filteredJobs.map((job) => renderJobCard(job))}
          </div>
        ) : (
          <p className="no-jobs">No jobs available.</p>
        )}
        
        {isMobile && !showReviews && (
          <button className="show-reviews-btn" onClick={toggleReviews}>
            Show Community Reviews
          </button>
        )}
      </div>

      {/* Right Column - Community Reviews */}
      {(!isMobile || (isMobile && showReviews)) && renderReviews()}

      {/* Job Details Modal */}
      {modalVisible && selectedJob && (
        <div className="job-details-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeModal}>&times;</span>
            <h1>{selectedJob.title}</h1>
            <p><strong>Company:</strong> {selectedJob.company}</p>
            <p><strong>Location:</strong> {selectedJob.location}</p>
            <p><strong>Salary:</strong> {selectedJob.salary ? `$${selectedJob.salary}` : "Not specified"}</p>
            <h2>Job Description</h2>
            <p>{selectedJob.description}</p>
            <h2>Requirements</h2>
            <p>{selectedJob.requirements || "No specific requirements listed."}</p>
            <div className="modal-actions">
              <Link to={`/apply/${selectedJob.id}`} className="apply-btn" state={{ jobId: selectedJob.id }}>Apply Now</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;