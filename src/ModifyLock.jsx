import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

export default function ModifyLock() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { state } = location || {};
  const json = (state && state.json) || null;
  const result = (state && state.result) || null;
  const lockJsonObject = result.lockJsonObject;
  
  console.log("json:", json);
  console.log("lockJsonObject:", lockJsonObject);

  const [contentId, setContentId] = useState("");
  const [destinationFolder, setDestinationFolder] = useState("");
  const [blackoutLocks, setBlackoutLocks] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  axios.defaults.withCredentials = true;

  // On mount, initialize using provided lockJsonObject and json.
  useEffect(() => {
    if (json && lockJsonObject) {
      // Use contentId from lockJsonObject.
      setContentId(lockJsonObject.contentid || lockJsonObject.contentId);
      // Compute destinationFolder using awsDestinationFolder (or folderPrefix) from json.
      const baseFolder = json.awsDestinationFolder
        ? (json.awsDestinationFolder.endsWith('/')
            ? json.awsDestinationFolder
            : json.awsDestinationFolder + '/')
        : ((json.folderPrefix || json.MetaData?.folderPrefix || "").endsWith('/')
            ? (json.folderPrefix || json.MetaData?.folderPrefix || "")
            : (json.folderPrefix || json.MetaData?.folderPrefix || "") + '/');
      setDestinationFolder(baseFolder + (lockJsonObject.contentid || lockJsonObject.contentId) + '/');
      // Initialize blackout locks.
      const existingLocks = lockJsonObject.locks || [];
      setBlackoutLocks(
        existingLocks.map(b => ({
          startTime: b.starttime.toString(),
          endTime: b.endtime.toString()
        }))
      );
      setMessage("Lock details loaded.");
    }else {
      setMessage("Missing AWS data or lock details. Please navigate from the video list.");
    }
  }, [json, lockJsonObject]);

  // Validation functions.
  const hasOverlappingSegments = (segments) => {
    const sorted = [...segments].sort((a, b) => parseFloat(a.startTime) - parseFloat(b.startTime));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (parseFloat(sorted[i].endTime) > parseFloat(sorted[i + 1].startTime)) {
        return {
          hasOverlap: true,
          message: `Overlap detected: Segment ${i + 1} overlaps with Segment ${i + 2}`
        };
      }
    }
    return { hasOverlap: false };
  };

  const isValidSegment = (segment) => {
    const start = parseFloat(segment.startTime);
    const end = parseFloat(segment.endTime);
    if (isNaN(start) || isNaN(end)) {
      return { isValid: false, message: "Start and end times must be numbers" };
    }
    if (start < 0 || end < 0) {
      return { isValid: false, message: "Times cannot be negative" };
    }
    if (start >= end) {
      return { isValid: false, message: "End time must be greater than start time" };
    }
    return { isValid: true };
  };

  const validateBlackoutLocks = () => {
    if (blackoutLocks.length === 0) {
      setValidationError("At least one blackout lock is required");
      return false;
    }
    for (let i = 0; i < blackoutLocks.length; i++) {
      const result = isValidSegment(blackoutLocks[i]);
      if (!result.isValid) {
        setValidationError(`Segment ${i + 1}: ${result.message}`);
        return false;
      }
    }
    const overlap = hasOverlappingSegments(blackoutLocks);
    if (overlap.hasOverlap) {
      setValidationError(overlap.message);
      return false;
    }
    return true;
  };

  const handleBlackoutLockChange = (index, field, value) => {
    const updated = [...blackoutLocks];
    updated[index][field] = value;
    setBlackoutLocks(updated);
    setValidationError("");
  };

  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
    setValidationError("");
  };

  const handleDeleteBlackoutLock = (index) => {
    const updated = blackoutLocks.filter((_, i) => i !== index);
    setBlackoutLocks(updated);
    setValidationError("");
  };

  const handleSubmitModification = async () => {
    if (!json || !lockJsonObject) {
      setMessage("Missing required JSON data or lock object.");
      return;
    }
    
    if (!validateBlackoutLocks()) {
      return;
    }
    
    setLoading(true);
    setMessage("Processing...");
    
    const mappedLocks = blackoutLocks.map(lock => ({
      lock_type: "blackout-lock",
      startTime: lock.startTime,
      endTime: lock.endTime
    }));
    
    // Format the request body.
    const requestBody = {
      storage_type: json.storage_type,
      MetaData: json.MetaData,
      contentId: contentId,
      lockId: result.lock_id,
      newLocks: mappedLocks,
      folder: destinationFolder
    };
    
    try {
      console.log("request body: \n\n\n")
      console.log(requestBody);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/modify-AES`,
        requestBody,
        { withCredentials: true }
      );
      
      setMessage("Modification successful! " + response.data.message);
      
      // Optionally redirect back to the video list.
      // navigate("/show-videos");
    } catch (error) {
      console.error("Error submitting modification:", error);
      setMessage("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div style={styles.container}>
        <h1 style={styles.heading}>Modify Lock / Reprocess Video</h1>
        
        
        {message && <p style={styles.message}>{message}</p>}
        
        {/* Display content ID and destination folder */}
        {contentId && (
          <div style={styles.formGroup}>
            <h3 style={styles.subheading}>Video Details</h3>
            <p><strong>Content ID:</strong> {contentId}</p>
            <p><strong>Destination:</strong> {destinationFolder}</p>
          </div>
        )}
        
        {blackoutLocks.length > 0 && (
          <div style={styles.formGroup}>
            <h3 style={styles.subheading}>Blackout Locks</h3>
            {validationError && (
              <div style={styles.errorMessage}>⚠️ {validationError}</div>
            )}
            {blackoutLocks.map((lock, index) => (
              <div key={index} style={styles.lockContainer}>
                <input
                  type="number"
                  placeholder="Start Time (sec)"
                  value={lock.startTime}
                  onChange={(e) =>
                    handleBlackoutLockChange(index, "startTime", e.target.value)
                  }
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="End Time (sec)"
                  value={lock.endTime}
                  onChange={(e) =>
                    handleBlackoutLockChange(index, "endTime", e.target.value)
                  }
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
  input: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    margin: "5px",
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

