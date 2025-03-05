import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

export default function ShowVideos() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  useEffect(() => {
    async function fetchFolders() {
      try {
        const response = await axios.get(`${process.env.VITE_API_URL}/get-folder-names`);
        setFolders(response.data.folders || []);
      } catch (error) {
        console.error("Error fetching folders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFolders();
  }, []);

  const handlePreview = (folderUrl) => {
    navigate("/preview", { state: { folderUrl } });
  };

  return (
    <div>
      <NavBar />
      <div style={styles.container}>
        <h1 style={styles.heading}>Available Videos</h1>
        {loading ? (
          <p style={styles.status}>Loading folders...</p>
        ) : folders.length === 0 ? (
          <p style={styles.status}>No videos available.</p>
        ) : (
          <ul style={styles.ul}>
            {folders.map((folder, index) => (
              <li key={index} style={styles.li}>
                <button 
                  onClick={() => handlePreview(folder)} 
                  style={styles.button}
                >
                  {folder}
                </button>
              </li>
            ))}
          </ul>
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
  status: {
    fontSize: "18px",
    marginBottom: "30px",
    color: "#555",
  },
  ul: {
    listStyle: "none",
    padding: 0,
  },
  li: {
    marginBottom: "15px",
  },
  button: {
    padding: "15px 30px",
    fontSize: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#ff9800",
    color: "#fff",
    transition: "background-color 0.3s ease",
  },
};

