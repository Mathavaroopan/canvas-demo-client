import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function VideoUpload() {
  const [videoFile, setVideoFile] = useState(null);
  const [platformId, setPlatformId] = useState(""); 
  const [userId, setUserId] = useState("");
  const [contentId, setContentId] = useState("");
  const [blackoutLocks, setBlackoutLocks] = useState([]);
  const [folderUrl, setFolderUrl] = useState(null);
  const navigate = useNavigate();

  // Handle video file selection
  const handleVideoUpload = (e) => {
    setVideoFile(e.target.files[0]);
  };

  // Add a new blackout lock field
  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
  };

  // Update blackout lock field values
  const handleBlackoutLockChange = (index, key, value) => {
    const newLocks = [...blackoutLocks];
    newLocks[index][key] = value;
    setBlackoutLocks(newLocks);
  };

  // Submit the form to process the video
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
      const response = await axios.post("http://localhost:3000/create-lock", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status !== 201) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      alert("Video processing completed! Lock created successfully.");
      console.log("Server Response:", response.data);
      // Save the returned folder URL from the Lock document
      setFolderUrl(response.data.lock.FolderUrl);
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to process the video. Please try again.");
    }
  };

  // When folderUrl is available, show the preview button which navigates to /preview.
  const handlePreview = () => {
    if (folderUrl) {
      navigate("/preview", { state: { folderUrl } });
    }
  };

  return (
    <div style={styles.container}>
      <h2>📤 Upload Video</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleVideoUpload} />
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
        <h3>🎥 Blackout Locks</h3>
        {blackoutLocks.map((lock, index) => (
          <div key={index} style={styles.lockContainer}>
            <input
              type="number"
              placeholder="Start Time (sec)"
              value={lock.startTime}
              onChange={(e) => handleBlackoutLockChange(index, "startTime", e.target.value)}
            />
            <input
              type="number"
              placeholder="End Time (sec)"
              value={lock.endTime}
              onChange={(e) => handleBlackoutLockChange(index, "endTime", e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={handleAddBlackoutLock} style={styles.addButton}>
          ➕ Add Blackout Lock
        </button>
        <button type="submit" style={styles.submitButton}>
          🚀 Process Video
        </button>
      </form>
      {folderUrl && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={handlePreview} style={styles.previewButton}>
            Preview Video
          </button>
        </div>
      )}
    </div>
  );
}

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
  previewButton: {
    backgroundColor: "#FFA500",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

