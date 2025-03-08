// VideoPreview.jsx

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import NavBar from "./NavBar";
import VideoPlayer from "./VideoPlayer";

export default function VideoPreview() {
  const location = useLocation();
  const { folderUrl, awsData } = location.state || {};

  const [downloadStatus, setDownloadStatus] = useState("Downloading HLS files...");
  const [previewReady, setPreviewReady] = useState(false);
  const [originalUrl, setOriginalUrl] = useState("");
  const [blackoutUrl, setBlackoutUrl] = useState("");
  axios.defaults.withCredentials = true;

  useEffect(() => {
    async function downloadFolder() {
      try {
        if (!folderUrl || !awsData) {
          setDownloadStatus("No folder URL or AWS data provided.");
          return;
        }

        // We might ensure it ends with "/" if needed
        let prefix = folderUrl;
        if (!prefix.endsWith("/")) {
          prefix += "/";
        }

        // Call a new server endpoint: POST /download-folder-from-json
        // passing the user AWS creds + the chosen prefix
        await axios.post(
          `${import.meta.env.VITE_API_URL}/download-video`,
          {
            awsData,
            folderPrefix: prefix
          },
          { withCredentials: true }
        );

        // If the server downloads successfully, 
        // the local Express static path now has `output.m3u8` and `blackout.m3u8`.
        setOriginalUrl(`${import.meta.env.VITE_API_URL}/output.m3u8`);
        setBlackoutUrl(`${import.meta.env.VITE_API_URL}/blackout.m3u8`);
        setDownloadStatus("Download complete. Preview ready!");
        setPreviewReady(true);

      } catch (error) {
        console.error("Error downloading HLS folder:", error);
        setDownloadStatus("Error downloading HLS files. Check console/logs.");
      }
    }

    downloadFolder();
  }, [folderUrl, awsData]);

  return (
    <div>
      <NavBar />
      <div style={styles.container}>
        <h1 style={styles.heading}>Video Preview</h1>
        <p style={styles.status}>{downloadStatus}</p>

        {previewReady && (
          <VideoPlayer originalUrl={originalUrl} blackoutUrl={blackoutUrl} />
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
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  heading: {
    fontSize: "36px",
    marginBottom: "20px",
  },
  status: {
    fontSize: "18px",
    marginBottom: "30px",
  },
};
