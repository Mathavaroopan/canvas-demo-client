import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import VideoPlayer from "./VideoPlayer";
import NavBar from "./NavBar";

export default function VideoPreview() {
  const location = useLocation();
  const { folderUrl } = location.state || {};
  const [downloadStatus, setDownloadStatus] = useState("Downloading HLS files...");
  const [previewReady, setPreviewReady] = useState(false);
  const [originalUrl, setOriginalUrl] = useState("");
  const [blackoutUrl, setBlackoutUrl] = useState("");
  axios.defaults.withCredentials = true;

  useEffect(() => {
    async function downloadFolder() {
      try {
        if (!folderUrl) {
          setDownloadStatus("No folder URL provided.");
          return;
        }
        // Extract folder prefix from folderUrl.
        let folderPrefix;
        if (folderUrl.includes("amazonaws.com/")) {
          const parts = folderUrl.split("amazonaws.com/");
          folderPrefix = parts[1];
        } else {
          folderPrefix = folderUrl;
        }
        if (!folderPrefix.endsWith("/")) {
          folderPrefix += "/";
        }
        // Call the download-folder API.
        await axios.get(`${import.meta.env.VITE_API_URL}/download-folder?folderPrefix=${folderPrefix}`, { withCredentials: true });
        // After download, assume that the express static server is serving files from the local hls_output folder.
        setOriginalUrl(`${import.meta.env.VITE_API_URL}/output.m3u8`, { withCredentials: true });;
        setBlackoutUrl(`${import.meta.env.VITE_API_URL}/blackout.m3u8`, { withCredentials: true });;
        setDownloadStatus("Download complete. Preview ready.");
        setPreviewReady(true);
      } catch (error) {
        console.error("Error downloading HLS folder:", error);
        setDownloadStatus("Error downloading HLS files.");
      }
    }
    downloadFolder();
  }, [folderUrl]);

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
