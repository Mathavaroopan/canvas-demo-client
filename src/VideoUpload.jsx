import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

export default function VideoUpload() {
  const [videoFile, setVideoFile] = useState(null);
  const [platformId, setPlatformId] = useState(""); 
  const [userId, setUserId] = useState("");
  const [contentId, setContentId] = useState("");
  const [blackoutLocks, setBlackoutLocks] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [existingFolders, setExistingFolders] = useState([]);
  const [folderNameExists, setFolderNameExists] = useState(false);
  const [folderUrl, setFolderUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  // Fetch existing folder names when component mounts.
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/get-folder-names`, { withCredentials: true })
      .then((res) => {
        setExistingFolders(res.data.folders || []);
      })
      .catch((err) => {
        console.error("Error fetching folder names:", err);
      });
  }, []);

  // Validate folder name as user types.
  useEffect(() => {
    const trimmed = folderName.trim();
    const exists = existingFolders.some(f => f.toLowerCase() === (trimmed + "/").toLowerCase());
    setFolderNameExists(exists);
  }, [folderName, existingFolders]);

  const handleVideoUpload = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
  };

  const handleBlackoutLockChange = (index, key, value) => {
    const newLocks = [...blackoutLocks];
    newLocks[index][key] = value;
    setBlackoutLocks(newLocks);
  };

  // Function to delete a blackout lock.
  const handleDeleteBlackoutLock = (index) => {
    const newLocks = [...blackoutLocks];
    newLocks.splice(index, 1);
    setBlackoutLocks(newLocks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !platformId || !userId || !contentId) {
      alert("Please fill in all required fields and upload a video.");
      return;
    }
    if (folderNameExists) {
      alert("Folder name already exists. Please choose a different folder name.");
      return;
    }

    setIsLoading(true);
    
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("platformId", platformId);
    formData.append("userId", userId);
    formData.append("contentId", contentId);
    formData.append("contentUrl", URL.createObjectURL(videoFile));
    formData.append("blackoutLocks", JSON.stringify(blackoutLocks));
    formData.append("folderName", folderName);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/create-lock`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.status !== 201) {
        throw new Error(`Upload failed: ${response.statusText}`, { withCredentials: true });;
      }
      
      alert("Video processing completed! Lock created successfully.");
      console.log("Server Response:", response.data);
      setFolderUrl(response.data.lock.FolderUrl);
      setIsLoading(false);
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to process the video. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (!folderUrl) {
      alert("No folder URL available for preview.");
      return;
    }
    navigate('/preview', { state: { folderUrl } });
  };

  return (
    <div>
      <NavBar />
      <div style={styles.container}>
        <h2 style={styles.heading}>Upload Your Video</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Video File:</label>
            <input type="file" onChange={handleVideoUpload} accept="video/*" style={styles.input}/>
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
          <div style={styles.formGroup}>
            <label style={styles.label}>Folder Name (optional):</label>
            <input
              type="text"
              placeholder="Folder Name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              style={styles.input}
            />
            {folderName && folderNameExists && (
              <p style={{ color: "red" }}>Folder name already exists. Choose another.</p>
            )}
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
        {folderUrl && (
          <div style={styles.previewContainer}>
            <button onClick={handlePreview} style={styles.previewButton}>
              👁️ Preview Video
            </button>
          </div>
        )}
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
  previewContainer: {
    marginTop: "30px",
    textAlign: "center",
  },
  previewButton: {
    backgroundColor: "#9c27b0",
    color: "#fff",
    border: "none",
    padding: "15px 30px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "18px",
  },
};

