import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue, update } from "firebase/database";

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});

  useEffect(() => {
    // Fetch job applications
    const applicationsRef = ref(db, "applications");
    onValue(applicationsRef, (snapshot) => {
      const applicationsData = snapshot.val();
      if (applicationsData) {
        const applicationsArray = Object.entries(applicationsData).map(
          ([appId, appDetails]) => ({
            id: appId,
            ...appDetails,
          })
        );
        setApplications(applicationsArray);
      }
    });

    // Fetch jobs
    const jobsRef = ref(db, "jobs");
    onValue(jobsRef, (snapshot) => {
      const jobsData = snapshot.val();
      if (jobsData) {
        setJobs(jobsData);
      }
    });
  }, []);

  // Function to mark an application as reviewed
  const markAsReviewed = (appId) => {
    const applicationRef = ref(db, `applications/${appId}`);
    update(applicationRef, { status: "Reviewed ✅" });
  };

  return (
    <div>
      <h2>Job Applications</h2>
      {applications.length > 0 ? (
        applications.map((app) => {
          // Find the job details using the jobId from the application
          const job = jobs[app.jobId] || {};
          return (
            <div key={app.id} style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
              <p><strong>{app.name}</strong> applied for <strong>{job.title || "Unknown Job"}</strong> at <strong>{job.company || "Unknown Company"}</strong></p>
              <p><strong>Email:</strong> {app.email}</p>
              <p><strong>Resume:</strong> {app.resume}</p>
              <p><strong>Status:</strong> {app.status || "Pending ⏳"}</p>
              {app.status !== "Reviewed ✅" && (
                <button onClick={() => markAsReviewed(app.id)}>Mark as Reviewed</button>
              )}
            </div>
          );
        })
      ) : (
        <p>No job applications found.</p>
      )}
    </div>
  );
};

export default Dashboard;
