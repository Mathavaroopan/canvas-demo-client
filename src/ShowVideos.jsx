import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

export default function ShowVideos() {
  const [awsData, setAwsData] = useState(null); // Parsed AWS JSON object
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  // Handle uploading the AWS JSON file.
  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setAwsData(parsed);
      setErrorMsg(""); // Clear any previous error
      console.log("Parsed AWS JSON:", parsed);
    } catch (error) {
      console.error("Error parsing AWS JSON file:", error);
      setErrorMsg("Invalid JSON file. Please check the format.");
    }
  };

  // Fetch folders from S3 using the provided AWS data.
  const fetchFolders = async () => {
    if (!awsData) {
      setErrorMsg("Please upload a valid AWS JSON file first.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
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
      setErrorMsg("Failed to fetch folders. Check console/logs.");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the preview page for a given folder.
  const handlePreview = (folderUrl) => {
    navigate("/preview", {
      state: { folderUrl, awsData },
    });
  };

  /**
   * Navigate to the modify route.
   * This function first extracts the content id from the folder URL, fetches the lock details,
   * and then passes awsData along with the LockJsonObject (from the lock record)
   * to the ModifyLock component via location state.
   */
  const handleEditFolder = async (folderUrl) => {
    let prefix = awsData.folderPrefix || "";
    if (prefix && !prefix.endsWith("/")) {
      prefix += "/";
    }
    const contentId = folderUrl.replace(prefix, "").replace(/\/$/, "");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/get-lock-by-contentid/${contentId}`,
        { withCredentials: true }
      );
      if (response.data && response.data.lock) {
        const lockJsonObject = response.data.lock.LockJsonObject;
        // Pass awsData and lockJsonObject to the modify page.
        navigate("/modify-videos", {
          state: { awsData, lockJsonObject },
        });
      } else {
        setErrorMsg("Lock not found for this folder.");
      }
    } catch (err) {
      console.error("Error fetching lock details for edit:", err);
      setErrorMsg("Error fetching lock details for edit.");
    }
  };

  // Delete a folder using similar steps as before.
  const handleDeleteFolder = async (folder) => {
    if (!awsData) {
      setErrorMsg("AWS JSON not provided.");
      return;
    }
    let prefix = awsData.folderPrefix || "";
    if (prefix && !prefix.endsWith("/")) {
      prefix += "/";
    }
    const contentId = folder.replace(prefix, "").replace(/\/$/, "");
    try {
      const lockResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/get-lock-by-contentid/${contentId}`,
        { withCredentials: true }
      );
      console.log(`${import.meta.env.VITE_API_URL}/get-lock-by-contentid/${contentId}`);
      if (lockResponse.data && lockResponse.data.lock) {
        const lockId = lockResponse.data.lock.LockJsonObject.lockId;
        const payload = { awsData, lockId };
        const delResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/delete-AES`,
          payload,
          { withCredentials: true }
        );
        if (
          delResponse.data &&
          delResponse.data.message === "Folder deleted successfully"
        ) {
          setErrorMsg("Folder deleted successfully");
          fetchFolders();
        } else {
          setErrorMsg("Failed to delete folder.");
        }
      } else {
        setErrorMsg("Lock not found for this folder.");
      }
    } catch (err) {
      console.error("Error deleting folder:", err);
      setErrorMsg("Error deleting folder.");
    }
  };

  return (
    <div>
      <NavBar />
      <div style={styles.container}>
        <h1 style={styles.heading}>Available Videos (S3 Folders)</h1>

        <div style={styles.formGroup}>
          <label style={styles.label}>Upload AWS JSON File:</label>
          <input
            type="file"
            accept=".json"
            onChange={handleJsonUpload}
            style={styles.input}
          />
        </div>

        {errorMsg && <p style={styles.error}>{errorMsg}</p>}

        {awsData && (
          <div style={styles.awsInfo}>
            <p>
              <strong>AWS Region:</strong> {awsData.awsRegion}
            </p>
            <p>
              <strong>Bucket Name:</strong> {awsData.awsBucketName}
            </p>
          </div>
        )}

        <button
          style={styles.buttonFetch}
          onClick={fetchFolders}
          disabled={!awsData || loading}
        >
          {loading ? "Fetching..." : "Fetch Folders"}
        </button>

        {folders.length > 0 ? (
          <ul style={styles.ul}>
            {folders.map((folder, index) => (
              <li key={index} style={styles.li}>
                <button
                  onClick={() => handlePreview(folder)}
                  style={styles.folderButton}
                >
                  {folder}
                </button>
                <button
                  onClick={() => handleEditFolder(folder)}
                  style={styles.editFolderButton}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder)}
                  style={styles.deleteFolderButton}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !loading && (
            <p style={styles.status}>No folders to display. (Or none found.)</p>
          )
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
  },
  error: {
    color: "red",
    fontWeight: "bold",
    marginTop: "10px",
  },
  awsInfo: {
    marginTop: "20px",
  },
  buttonFetch: {
    padding: "10px 20px",
    margin: "20px 0",
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  ul: {
    listStyle: "none",
    padding: 0,
  },
  li: {
    marginBottom: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },
  folderButton: {
    padding: "15px 30px",
    fontSize: "18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#ff9800",
    color: "#fff",
    transition: "background-color 0.3s ease",
  },
  editFolderButton: {
    padding: "10px 15px",
    fontSize: "18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#2196f3",
    color: "#fff",
    transition: "background-color 0.3s ease",
  },
  deleteFolderButton: {
    padding: "10px",
    fontSize: "18px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    backgroundColor: "#f44336",
    color: "#fff",
  },
  status: {
    fontSize: "18px",
    color: "#555",
    marginTop: "20px",
  },
};
