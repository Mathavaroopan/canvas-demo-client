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

  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
  };

  const handleBlackoutLockChange = (index, key, value) => {
    const newLocks = [...blackoutLocks];
    newLocks[index][key] = value;
    setBlackoutLocks(newLocks);
  };

  const handleDeleteBlackoutLock = (index) => {
    const newLocks = [...blackoutLocks];
    newLocks.splice(index, 1);
    setBlackoutLocks(newLocks);
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
};
