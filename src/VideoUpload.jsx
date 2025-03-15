import React, { useState } from 'react';
import axios from 'axios';
import NavBar from './NavBar';

export default function VideoUpload() {
  const [jsonFile, setJsonFile] = useState(null);
  const [awsData, setAwsData] = useState(null); // Parsed JSON will be stored here and sent as MetaData
  const [storageType, setStorageType] = useState("AWS"); // New state for storage type
  const [platformId, setPlatformId] = useState("");
  const [userId, setUserId] = useState("");
  const [contentId, setContentId] = useState("");
  const [locks, setLocks] = useState([]); // Locks array, but all will be mapped to blackout-lock
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Handle JSON file upload and parsing.
  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonFile(file);
      setAwsData(parsed); // This parsed JSON is our MetaData
      console.log("Parsed JSON:", parsed);
    } catch (error) {
      console.error("Error parsing JSON file:", error);
      alert("Invalid JSON file. Please check the format.");
    }
  };

  // Check for overlapping segments.
  const hasOverlappingSegments = (segments) => {
    const sortedSegments = [...segments].sort(
      (a, b) => parseFloat(a.startTime) - parseFloat(b.startTime)
    );
    for (let i = 0; i < sortedSegments.length - 1; i++) {
      const current = sortedSegments[i];
      const next = sortedSegments[i + 1];
      if (parseFloat(current.endTime) > parseFloat(next.startTime)) {
        return {
          hasOverlap: true,
          message: `Overlap detected: Segment ${i+1} (${current.startTime}-${current.endTime}) overlaps with Segment ${i+2} (${next.startTime}-${next.endTime})`
        };
      }
    }
    return { hasOverlap: false };
  };

  // Validate individual lock segment.
  const isValidSegment = (segment) => {
    const start = parseFloat(segment.startTime);
    const end = parseFloat(segment.endTime);
    if (isNaN(start) || isNaN(end)) {
      return { isValid: false, message: "Start and end times must be valid numbers" };
    }
    if (start < 0 || end < 0) {
      return { isValid: false, message: "Start and end times cannot be negative" };
    }
    if (start >= end) {
      return { isValid: false, message: "End time must be greater than start time" };
    }
    return { isValid: true };
  };

  // Add a new lock.
  const handleAddLock = () => {
    setLocks([...locks, { startTime: "", endTime: "" }]);
    setValidationError("");
  };

  // Update a lock.
  const handleLockChange = (index, key, value) => {
    const newLocks = [...locks];
    newLocks[index][key] = value;
    setLocks(newLocks);
    setValidationError("");
  };

  // Delete a lock.
  const handleDeleteLock = (index) => {
    const newLocks = [...locks];
    newLocks.splice(index, 1);
    setLocks(newLocks);
    setValidationError("");
  };

  // Validate the locks before submission.
  const validateLocks = () => {
    if (locks.length === 0) return true;
    for (let i = 0; i < locks.length; i++) {
      const result = isValidSegment(locks[i]);
      if (!result.isValid) {
        setValidationError(`Segment ${i+1}: ${result.message}`);
        return false;
      }
    }
    const overlapResult = hasOverlappingSegments(locks);
    if (overlapResult.hasOverlap) {
      setValidationError(overlapResult.message);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!awsData) {
      alert("Please upload a valid JSON file with AWS and video information.");
      return;
    }
    if (!platformId || !userId || !contentId) {
      alert("Please fill in all required fields (Platform ID, User ID, Content ID).");
      return;
    }
    if (!validateLocks()) return;

    setIsLoading(true);
    try {
      // Map all locks to use "blackout-lock" as lock_type.
      const mappedLocks = locks.map(lock => ({
        lock_type: "blackout-lock",
        startTime: lock.startTime,
        endTime: lock.endTime
      }));
      console.log("AWS Data:", awsData);
      // Build the payload in the expected format.
      const payload = {
        storage_type: storageType,
        MetaData: awsData,
        platformId,
        userId,
        contentId,
        locks: mappedLocks,
      };
      console.log("Payload:", payload);
      // Uncomment below to send the API call
      // const response = await axios.post(
      //   `${import.meta.env.VITE_API_URL}/create-AES`,
      //   payload
      // );
      // if (response.status !== 201) {
      //   throw new Error(`Processing failed: ${response.statusText}`);
      // }
      alert("Video processing completed! Lock created successfully.");
      // console.log("Server Response:", response.data);
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to process the video. Please check the console/logs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div style={styles.container}>
        <h2 style={styles.heading}>Process Video From S3</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Upload JSON File:</label>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Storage Type:</label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value)}
              style={styles.input}
            >
              <option value="AWS">AWS</option>
              {/* Future options can be added here */}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Platform ID:</label>
            <input
              type="text"
              placeholder="Platform ID"
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>User ID:</label>
            <input
              type="text"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Content ID:</label>
            <input
              type="text"
              placeholder="Content ID"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              style={styles.input}
            />
          </div>
          <h3 style={styles.subheading}>Blackout Locks</h3>
          {validationError && (
            <div style={styles.errorMessage}>⚠️ {validationError}</div>
          )}
          {locks.map((lock, index) => (
            <div key={index} style={styles.lockContainer}>
              <input
                type="number"
                placeholder="Start Time (sec)"
                value={lock.startTime}
                onChange={(e) => handleLockChange(index, "startTime", e.target.value)}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="End Time (sec)"
                value={lock.endTime}
                onChange={(e) => handleLockChange(index, "endTime", e.target.value)}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => handleDeleteLock(index)}
                style={styles.deleteButton}
              >
                🗑️
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddLock} style={styles.addButton}>
            ➕ Add Blackout Lock
          </button>
          <button type="submit" style={styles.submitButton} disabled={isLoading}>
            {isLoading ? "Processing..." : "🚀 Process Video"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "80%",
    margin: "40px auto",
    padding: "30px",
    background: "#f5f5f5",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  },
  heading: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "20px",
  },
  subheading: {
    marginTop: "30px",
    fontSize: "24px",
    marginBottom: "15px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "16px",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  lockContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  addButton: {
    backgroundColor: "#008CBA",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    padding: "15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "18px",
    width: "100%",
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "15px",
    textAlign: "center",
    fontWeight: "bold",
  },
};

