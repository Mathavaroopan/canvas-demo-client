import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import VideoPlayer from "./VideoPlayer";

export default function VideoPreview() {
  const location = useLocation();
  const { folderUrl } = location.state || {};
  const [downloadStatus, setDownloadStatus] = useState("Downloading HLS files...");
  const [previewReady, setPreviewReady] = useState(false);
  // These URLs assume that your express static server serves the local hls_output folder.
  const [originalUrl, setOriginalUrl] = useState("");
  const [blackoutUrl, setBlackoutUrl] = useState("");

  useEffect(() => {
    async function downloadFolder() {
      try {
        if (!folderUrl) {
          setDownloadStatus("No folder URL provided.");
          return;
        }
        // Extract submissionId from folderUrl. For example, if folderUrl is "https://bucket.s3.amazonaws.com/submissionId/"
        const parts = folderUrl.split("/");
        const submissionId = parts[parts.length - 2];
        // Call the download-folder API.
        await axios.get(`http://localhost:3000/download-folder?folderPrefix=${submissionId}/`);
        // After download, assume that your express static server is serving from the local hls_output folder.
        setOriginalUrl("http://localhost:3000/output.m3u8");
        setBlackoutUrl("http://localhost:3000/blackout.m3u8");
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
    <div style={{ width: "60%", margin: "auto", padding: "20px" }}>
      <h1>Video Preview</h1>
      <p>{downloadStatus}</p>
      {previewReady && (
        <VideoPlayer originalUrl={originalUrl} blackoutUrl={blackoutUrl} />
      )}
    </div>
  );
}
