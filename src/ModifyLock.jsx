import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

export default function ModifyLock() {
  const location = useLocation();
  const navigate = useNavigate();
  // Now we expect awsData and lockJsonObject to be passed via location state.
  const { awsData, lockJsonObject } = location.state || {};
  console.log(awsData);
  console.log(lockJsonObject);
  const [contentId, setContentId] = useState("");
  const [destinationFolder, setDestinationFolder] = useState("");
  const [blackoutLocks, setBlackoutLocks] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  axios.defaults.withCredentials = true;

  // On mount, use the provided lockJsonObject to initialize the component.
  useEffect(() => {
    if (awsData && lockJsonObject) {
      // Set contentId from the lockJsonObject.
      setContentId(lockJsonObject.contentId);
      // Compute destinationFolder using awsData.awsDestinationFolder if available.
      if (awsData.folderPrefix) {
        const baseFolder = awsData.folderPrefix.endsWith('/')
          ? awsData.folderPrefix
          : awsData.folderPrefix + '/';
        setDestinationFolder(baseFolder + lockJsonObject.contentId + '/');
      }
      // Set blackout locks from the existing lock data.
      const existingLocks = lockJsonObject.locks["blackout-locks"];
      setBlackoutLocks(
        existingLocks.map(b => ({
          startTime: b.startTime,
          endTime: b.endTime
        }))
      );
      setMessage("Lock details loaded.");
    } else {
      setMessage("Missing AWS data or lock details. Please navigate from the video list.");
    }
  }, [awsData, lockJsonObject]);

  // Check for overlapping segments.
  const hasOverlappingSegments = (segments) => {
    const sortedSegments = [...segments].sort((a, b) => parseFloat(a.startTime) - parseFloat(b.startTime));
    for (let i = 0; i < sortedSegments.length - 1; i++) {
      const currentSegment = sortedSegments[i];
      const nextSegment = sortedSegments[i + 1];
      const currentEnd = parseFloat(currentSegment.endTime);
      const nextStart = parseFloat(nextSegment.startTime);
      if (currentEnd > nextStart) {
        return {
          hasOverlap: true,
          message: `Overlap detected: Segment ${i + 1} (${currentSegment.startTime}-${currentSegment.endTime}) overlaps with Segment ${i + 2} (${nextSegment.startTime}-${nextSegment.endTime})`
        };
      }
    }
    return { hasOverlap: false };
  };

  // Validate a single segment.
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

  // Handlers for editing blackout locks.
  const handleBlackoutLockChange = (index, field, value) => {
    const updatedLocks = [...blackoutLocks];
    updatedLocks[index][field] = value;
    setBlackoutLocks(updatedLocks);
    setValidationError("");
  };

  const handleAddBlackoutLock = () => {
    setBlackoutLocks([...blackoutLocks, { startTime: "", endTime: "" }]);
    setValidationError("");
  };

  const handleDeleteBlackoutLock = (index) => {
    const updatedLocks = blackoutLocks.filter((_, i) => i !== index);
    setBlackoutLocks(updatedLocks);
    setValidationError("");
  };

  const validateBlackoutLocks = () => {
    if (blackoutLocks.length === 0) {
      setValidationError("At least one blackout lock is required");
      return false;
    }
    for (let i = 0; i < blackoutLocks.length; i++) {
      const validation = isValidSegment(blackoutLocks[i]);
      if (!validation.isValid) {
        setValidationError(`Segment ${i + 1}: ${validation.message}`);
        return false;
      }
    }
    const overlapCheck = hasOverlappingSegments(blackoutLocks);
    if (overlapCheck.hasOverlap) {
      setValidationError(overlapCheck.message);
      return false;
    }
    return true;
  };

  // Submit the modifications.
  const handleSubmitModification = async () => {
    if (!contentId || !awsData || !destinationFolder) {
      console.log(contentId);
      console.log(awsData);
      console.log(destinationFolder);
      setMessage("Missing required details. Cannot submit modification.");
      return;
    }
    if (!validateBlackoutLocks()) {
      return;
    }
    try {
      setLoading(true);
      const payload = {
        // Send lockId from lockJsonObject if needed in backend (or adjust accordingly)
        lockId: lockJsonObject.lockId,
        awsData,
        newBlackoutLocks: blackoutLocks,
        folder: destinationFolder
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
        {message && <p style={styles.message}>{message}</p>}
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
