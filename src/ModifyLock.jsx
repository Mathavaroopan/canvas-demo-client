import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

export default function ModifyLock() {
  const [awsData, setAwsData] = useState(null); // Parsed AWS JSON
  const [contentId, setContentId] = useState(""); // Derived from folder click
  const [destinationFolder, setDestinationFolder] = useState(""); // Full folder string, e.g. "AES-videos/first-json-show-videos/"
  const [lockId, setLockId] = useState("");
  const [blackoutLocks, setBlackoutLocks] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();
  
  axios.defaults.withCredentials = true;

  // Handle AWS JSON file upload.
  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setAwsData(parsed);
      setMessage("");
      console.log("Parsed AWS JSON:", parsed);
    } catch (error) {
      console.error("Error parsing AWS JSON file:", error);
      setMessage("Invalid JSON file. Please check the format.");
    }
  };

  // Fetch folders (S3 folder names) like in your ShowVideos component.
  const fetchFolders = async () => {
    if (!awsData) {
      setMessage("Please upload a valid AWS JSON file first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/get-video-names`,
        { awsData },
        { withCredentials: true }
      );
      if (response.data && response.data.folders) {
        setFolders(response.data.folders);
      } else {
        setFolders([]);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
      setMessage("Failed to fetch folders.");
    } finally {
      setLoading(false);
    }
  };

  // When a folder is clicked, extract the content id from the folder name,
  // then fetch the lock details using the new endpoint.
  const handleFolderClick = async (folder) => {
    // Assume awsData.folderPrefix is defined in the AWS JSON.
    // For example, if folder is "AES-videos/first-json-show-videos/" and folderPrefix is "AES-videos/",
    // then the content id is "first-json-show-videos".
    let prefix = awsData.folderPrefix || "";
    if (prefix && !prefix.endsWith("/")) {
      prefix += "/";
    }
    // Save the full folder as the destination.
    setDestinationFolder(folder);
    // Remove the prefix and the trailing slash.
    const extractedContentId = folder.replace(prefix, "").replace(/\/$/, "");
    setContentId(extractedContentId);
    setMessage(`Fetching lock details for content id: ${extractedContentId}`);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/get-lock-by-contentid/${extractedContentId}`,
        { withCredentials: true }
      );
      console.log(response.data);
      if (response.data && response.data.lock) {
        // Use the correct property name "LockJsonObject" from the response.
        const existingLocks = response.data.lock.LockJsonObject.locks["blackout-locks"];
        setLockId(response.data.lock._id);
        setBlackoutLocks(
          existingLocks.map(b => ({
            startTime: b.startTime,
            endTime: b.endTime
          }))
        );
        setMessage("Lock details fetched.");
      } else {
        setMessage("Lock details not found for the selected content.");
      }
    } catch (err) {
      console.error("Error fetching lock details:", err);
      setMessage("Failed to fetch lock details.");
    }
  };

  // Handle changes in blackout lock fields.
  const handleBlackoutLockChange = (index, field, value) => {
    const updatedLocks = [...blackoutLocks];
    updatedLocks[index][field] = value;
    setBlackoutLocks(updatedLocks);
  };

  // Add a new blackout lock entry.
  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
  };

  // Delete a blackout lock entry.
  const handleDeleteBlackoutLock = (index) => {
    const updatedLocks = blackoutLocks.filter((_, i) => i !== index);
    setBlackoutLocks(updatedLocks);
  };

  // Submit the modifications.
  const handleSubmitModification = async () => {
    if (!contentId || !awsData || blackoutLocks.length === 0 || !destinationFolder) {
      setMessage("Please ensure a folder is selected, AWS JSON is provided, and blackout locks are available.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        lockId: lockId, // This lockId is obtained when the folder is clicked.
        awsData, // awsData should include awsAccessKeyId, awsSecretAccessKey, awsRegion, awsBucketName.
        newBlackoutLocks: blackoutLocks,
        folder: destinationFolder // Pass the full folder (e.g., "AES-videos/first-json-show-videos/") as the destination.
      };
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/modify-AES`,
        payload,
        { withCredentials: true }
      );
      if (response.data) {
        setMessage("Lock modified successfully!");
        console.log("Response from modify-AES:", response.data);
      }
    } catch (err) {
      console.error("Error modifying lock:", err);
      setMessage("Failed to modify lock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div style={styles.container}>
        <h1 style={styles.heading}>Modify Lock / Reprocess Video</h1>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Upload AWS JSON File:</label>
          <input
            type="file"
            accept=".json"
            onChange={handleJsonUpload}
            style={styles.input}
          />
        </div>

        {awsData && (
          <div style={styles.awsInfo}>
            <p><strong>AWS Region:</strong> {awsData.awsRegion}</p>
            <p><strong>Bucket Name:</strong> {awsData.awsBucketName}</p>
          </div>
        )}

        <div style={styles.formGroup}>
          <button
            style={styles.buttonFetch}
            onClick={fetchFolders}
            disabled={!awsData || loading}
          >
            {loading ? "Fetching Folders..." : "Fetch Folders"}
          </button>
        </div>

        {folders.length > 0 && (
          <ul style={styles.ul}>
            {folders.map((folder, index) => (
              <li key={index} style={styles.li}>
                <button
                  onClick={() => handleFolderClick(folder)}
                  style={styles.folderButton}
                >
                  {folder}
                </button>
              </li>
            ))}
          </ul>
        )}

        {blackoutLocks.length > 0 && (
          <div style={styles.formGroup}>
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
          </div>
        )}

        <div style={styles.formGroup}>
          <button
            onClick={handleSubmitModification}
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Modification"}
          </button>
        </div>
        
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "80%",
    margin: "40px auto",
    padding: "30px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  heading: {
    fontSize: "36px",
    marginBottom: "20px",
    color: "#333",
  },
  subheading: {
    fontSize: "28px",
    marginBottom: "10px",
    color: "#333",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    margin: "5px",
  },
  awsInfo: {
    marginTop: "20px",
  },
  buttonFetch: {
    padding: "10px 20px",
    margin: "10px",
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  submitButton: {
    padding: "12px 25px",
    backgroundColor: "#2196f3",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  ul: {
    listStyle: "none",
    padding: 0,
  },
  li: {
    marginBottom: "15px",
  },
  folderButton: {
    padding: "15px 30px",
    fontSize: "18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#ff9800",
    color: "#fff",
  },
  lockContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "10px",
  },
  deleteButton: {
    marginLeft: "10px",
    backgroundColor: "#f44336",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  addButton: {
    backgroundColor: "#4caf50",
    border: "none",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  },
  message: {
    fontSize: "18px",
    marginTop: "20px",
    color: "#333",
  }
};
