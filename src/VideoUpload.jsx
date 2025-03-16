import React, { useState } from 'react';
import axios from 'axios';
import NavBar from './NavBar';

export default function VideoUpload() {
  const [storageType, setStorageType] = useState("AWS");
  const [awsData, setAwsData] = useState(null); // Parsed JSON for storageMetaData
  const [inputVideoUrl, setInputVideoUrl] = useState("");
  const [lockedVideoUrl, setLockedVideoUrl] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [userName, setUserName] = useState("");
  const [contentId, setContentId] = useState("");
  const [locks, setLocks] = useState([]); // Array of blackout lock segments
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Handle JSON file upload for storageMetaData.
  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setAwsData(parsed);
      setValidationError("");
      console.log("Parsed storageMetaData:", parsed);
    } catch (error) {
      console.error("Error parsing JSON file:", error);
      setValidationError("Invalid JSON file. Please check the format.");
    }
  };

  // Lock management functions.
  const handleAddLock = () => {
    setLocks([...locks, { lock_type: "blackout-lock", startTime: "", endTime: "" }]);
    setValidationError("");
  };

  const handleLockChange = (index, key, value) => {
    const newLocks = [...locks];
    newLocks[index][key] = value;
    setLocks(newLocks);
    setValidationError("");
  };

  const handleDeleteLock = (index) => {
    const newLocks = locks.filter((_, idx) => idx !== index);
    setLocks(newLocks);
    setValidationError("");
  };

  // Validate a lock segment.
  const isValidSegment = (segment) => {
    const start = parseFloat(segment.startTime);
    const end = parseFloat(segment.endTime);
    if (isNaN(start) || isNaN(end)) return false;
    if (start < 0 || end < 0) return false;
    if (start >= end) return false;
    return true;
  };

  // Validate all locks.
  const validateLocks = () => {
    for (let i = 0; i < locks.length; i++) {
      if (!isValidSegment(locks[i])) {
        setValidationError(`Invalid lock segment at index ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!awsData) {
      setValidationError("Please upload a valid JSON file for storageMetaData.");
      return;
    }
    if (!inputVideoUrl || !lockedVideoUrl || !platformName || !userName || !contentId) {
      setValidationError("Please fill in all required fields.");
      return;
    }
    if (!validateLocks()) {
      return;
    }
    setIsLoading(true);
    const payload = {
      storageType,
      storageMetaData: awsData,
      inputVideoUrl,
      lockedVideoUrl,
      platformName,
      userName,
      contentId,
      locks: locks.map(lock => ({
        lock_type: "blackout-lock",
        startTime: parseFloat(lock.startTime),
        endTime: parseFloat(lock.endTime)
      }))
    };
    console.log("Payload:", payload);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/create-AES`,
        payload
      );
      console.log("Response:", response.data);
      alert("Video processing completed! Lock created successfully.");
    } catch (error) {
      console.error("Error processing video:", error);
      setValidationError("Error processing video. Please check the console for details.");
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
            <label style={styles.label}>Storage Type:</label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value)}
              style={styles.input}
            >
              <option value="AWS">AWS</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Upload StorageMetaData JSON:</label>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Input Video URL:</label>
            <input
              type="text"
              value={inputVideoUrl}
              onChange={(e) => setInputVideoUrl(e.target.value)}
              placeholder="Enter input video URL"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Locked Video URL:</label>
            <input
              type="text"
              value={lockedVideoUrl}
              onChange={(e) => setLockedVideoUrl(e.target.value)}
              placeholder="Enter locked video URL"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Platform Name:</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Enter platform name"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>User Name:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter user name"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Content ID:</label>
            <input
              type="text"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              placeholder="Enter content id"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <h3 style={styles.subheading}>Blackout Locks</h3>
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
                  Delete
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddLock} style={styles.addButton}>
              Add Blackout Lock
            </button>
          </div>
          {validationError && <p style={styles.errorMessage}>{validationError}</p>}
          <button type="submit" style={styles.submitButton} disabled={isLoading}>
            {isLoading ? "Processing..." : "Process Video"}
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
