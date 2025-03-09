import React, { useState } from 'react';
import axios from 'axios';
import NavBar from './NavBar';

export default function VideoUpload() {
  const [jsonFile, setJsonFile] = useState(null);
  const [awsData, setAwsData] = useState(null); // we'll parse the JSON into this
  const [platformId, setPlatformId] = useState("");
  const [userId, setUserId] = useState("");
  const [contentId, setContentId] = useState("");
  const [blackoutLocks, setBlackoutLocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Handle uploading the JSON file locally and parse it.
  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonFile(file);
      setAwsData(parsed);
    } catch (error) {
      console.error("Error parsing JSON file:", error);
      alert("Invalid JSON file. Please check the format.");
    }
  };

  // Function to check for time segment overlaps
  const hasOverlappingSegments = (segments) => {
    // Sort segments by start time for easier comparison
    const sortedSegments = [...segments].sort((a, b) => parseFloat(a.startTime) - parseFloat(b.startTime));
    
    // Check for any overlap between adjacent segments
    for (let i = 0; i < sortedSegments.length - 1; i++) {
      const currentSegment = sortedSegments[i];
      const nextSegment = sortedSegments[i + 1];
      
      // Convert to numbers to ensure proper comparison
      const currentEnd = parseFloat(currentSegment.endTime);
      const nextStart = parseFloat(nextSegment.startTime);
      
      if (currentEnd > nextStart) {
        return {
          hasOverlap: true,
          message: `Overlap detected: Segment ${i+1} (${currentSegment.startTime}-${currentSegment.endTime}) overlaps with Segment ${i+2} (${nextSegment.startTime}-${nextSegment.endTime})`
        };
      }
    }
    
    return { hasOverlap: false };
  };

  // Validate a single segment for valid start/end times
  const isValidSegment = (segment) => {
    const startTime = parseFloat(segment.startTime);
    const endTime = parseFloat(segment.endTime);
    
    if (isNaN(startTime) || isNaN(endTime)) {
      return { isValid: false, message: "Start and end times must be valid numbers" };
    }
    
    if (startTime < 0 || endTime < 0) {
      return { isValid: false, message: "Start and end times cannot be negative" };
    }
    
    if (startTime >= endTime) {
      return { isValid: false, message: "End time must be greater than start time" };
    }
    
    return { isValid: true };
  };

  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
    setValidationError("");
  };

  const handleBlackoutLockChange = (index, key, value) => {
    const newLocks = [...blackoutLocks];
    newLocks[index][key] = value;
    setBlackoutLocks(newLocks);
    
    // Clear validation error when user makes changes
    setValidationError("");
  };

  const handleDeleteBlackoutLock = (index) => {
    const newLocks = [...blackoutLocks];
    newLocks.splice(index, 1);
    setBlackoutLocks(newLocks);
    setValidationError("");
  };

  const validateBlackoutLocks = () => {
    // Skip validation if no locks defined
    if (blackoutLocks.length === 0) {
      return true;
    }
    
    // Validate each individual segment
    for (let i = 0; i < blackoutLocks.length; i++) {
      const validation = isValidSegment(blackoutLocks[i]);
      if (!validation.isValid) {
        setValidationError(`Segment ${i+1}: ${validation.message}`);
        return false;
      }
    }
    
    // Check for overlaps between segments
    const overlapCheck = hasOverlappingSegments(blackoutLocks);
    if (overlapCheck.hasOverlap) {
      setValidationError(overlapCheck.message);
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
    
    // Validate the blackout locks before submission
    if (!validateBlackoutLocks()) {
      return;
    }

    setIsLoading(true);
    try {
      // Combine all data into one object
      const payload = {
        awsData,
        platformId,
        userId,
        contentId,
        blackoutLocks,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/create-AES`,
        payload
      );

      if (response.status !== 201) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      alert("Video processing completed! Lock created successfully.");
      console.log("Server Response:", response.data);
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
            <div style={styles.errorMessage}>
              ⚠️ {validationError}
            </div>
          )}
          
          {blackoutLocks.map((lock, index) => (
            <div key={index} style={styles.lockContainer}>
              <input
                type="number"
                placeholder="Start Time (sec)"
                value={lock.startTime}
                onChange={(e) => handleBlackoutLockChange(index, "startTime", e.target.value)}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="End Time (sec)"
                value={lock.endTime}
                onChange={(e) => handleBlackoutLockChange(index, "endTime", e.target.value)}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => handleDeleteBlackoutLock(index)}
                style={styles.deleteButton}
              >
                🗑️
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddBlackoutLock} style={styles.addButton}>
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