import React, { useState } from 'react';
import axios from 'axios';

const VideoUpload = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [platformId, setPlatformId] = useState(""); 
  const [userId, setUserId] = useState("");
  const [contentId, setContentId] = useState("");
  const [blackoutLocks, setBlackoutLocks] = useState([]);

  // Handle Video Upload
  const handleVideoUpload = (e) => {
    setVideoFile(e.target.files[0]);
  };

  // Handle Blackout Lock Addition
  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
  };

  // Handle Blackout Lock Change
  const handleBlackoutLockChange = (index, key, value) => {
    const newLocks = [...blackoutLocks];
    newLocks[index][key] = value;
    setBlackoutLocks(newLocks);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile || !platformId || !userId || !contentId) {
      alert("Please fill in all required fields and upload a video.");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("platformId", platformId);
    formData.append("userId", userId);
    formData.append("contentId", contentId);
    formData.append("contentUrl", URL.createObjectURL(videoFile));
    formData.append("blackoutLocks", JSON.stringify(blackoutLocks));

    try {
      const response = await axios.post("http://localhost:3000/api/create-lock", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "json",
      });

      if (response.status !== 201) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      alert("Video processing completed! Lock created successfully.");
      console.log("Server Response:", response.data);
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to process the video. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>📤 Upload Video</h2>
      <input type="file" onChange={handleVideoUpload} />

      <h3>🔹 Enter Platform ID, User ID & Content ID</h3>
      <input
        type="text"
        placeholder="Platform ID"
        value={platformId}
        onChange={(e) => setPlatformId(e.target.value)}
      />
      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Content ID"
        value={contentId}
        onChange={(e) => setContentId(e.target.value)}
      />

      {/* BLACKOUT LOCK SECTION */}
      <h3>🎥 Blackout Locks</h3>
      {blackoutLocks.map((lock, index) => (
        <div key={index} style={styles.lockContainer}>
          <input
            type="number"
            placeholder="Start Time"
            value={lock.startTime}
            onChange={(e) => handleBlackoutLockChange(index, "startTime", e.target.value)}
          />
          <input
            type="number"
            placeholder="End Time"
            value={lock.endTime}
            onChange={(e) => handleBlackoutLockChange(index, "endTime", e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleAddBlackoutLock} style={styles.addButton}>➕ Add Blackout Lock</button>

      <button onClick={handleSubmit} style={styles.submitButton}>🚀 Process Video</button>
    </div>
  );
};

const styles = {
  container: {
    width: "50%",
    margin: "auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
  },
  lockContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  addButton: {
    marginTop: "10px",
    backgroundColor: "#008CBA",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  submitButton: {
    marginTop: "20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default VideoUpload;
