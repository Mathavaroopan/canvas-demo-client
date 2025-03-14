import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

export default function ShowVideos() {
  const [json, setJson] = useState(null); // JSON object containing storage_type and MetaData
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  // Handle JSON file upload.
  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJson(parsed);
      setErrorMsg("");
      console.log("Parsed JSON:", parsed);
    } catch (error) {
      console.error("Error parsing JSON file:", error);
      setErrorMsg("Invalid JSON file. Please check the format.");
    }
  };

  // Fetch folder names from S3 using the uploaded JSON.
  const fetchFolders = async () => {
    if (!json) {
      setErrorMsg("Please upload a valid JSON file first.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/get-video-names`,
        json,
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
    console.log("sending this" + folderUrl);
    navigate("/preview", { state: { folderUrl, json } });
  };

  // Navigate to the edit page. Extracts contentId from the folder URL by removing the folderPrefix.
  const handleEditFolder = async (folderUrl) => {
    let prefix = json.MetaData.folderPrefix || "";
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
        navigate("/modify-videos", { state: { json, lockJsonObject } });
      } else {
        setErrorMsg("Lock not found for this folder.");
      }
    } catch (err) {
      console.error("Error fetching lock details for edit:", err);
      setErrorMsg("Error fetching lock details for edit.");
    }
  };

  // Delete a folder by first finding the associated lock.
  const handleDeleteFolder = async (folderUrl) => {
    if (!json) {
      setErrorMsg("JSON not provided.");
      return;
    }
    let prefix = json.MetaData.folderPrefix || "";
    if (prefix && !prefix.endsWith("/")) {
      prefix += "/";
    }
    const contentId = folderUrl.replace(prefix, "").replace(/\/$/, "");
    try {
      const lockResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/get-lock-by-contentid/${contentId}`,
        { withCredentials: true }
      );
      if (lockResponse.data && lockResponse.data.lock) {
        const lockId = lockResponse.data.lock.LockJsonObject.lockId;
        const payload = { json, lockId };
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
          <label style={styles.label}>Upload JSON File:</label>
          <input
            type="file"
            accept=".json"
            onChange={handleJsonUpload}
            style={styles.input}
          />
        </div>

        {errorMsg && <p style={styles.error}>{errorMsg}</p>}

        {json && json.MetaData && (
          <div style={styles.awsInfo}>
            <p>
              <strong>AWS Region:</strong> {json.MetaData.awsRegion}
            </p>
            <p>
              <strong>Bucket Name:</strong> {json.MetaData.awsBucketName}
            </p>
          </div>
        )}

        <button
          style={styles.buttonFetch}
          onClick={fetchFolders}
          disabled={!json || loading}
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
            <p style={styles.status}>
              No folders to display. (Or none found.)
            </p>
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

