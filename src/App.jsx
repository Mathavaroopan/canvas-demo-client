import React, { useEffect } from "react";
import axios from "axios";
import VideoPlayer from "./VideoPlayer";

export default function App() {
  useEffect(() => {
    // Call the download-folder API with a POST request.
    // Note: Adjust your server if needed, but here we send a POST request with the folderPrefix as a query param.
    axios
      .post("http://localhost:3000/download-folder?folderPrefix=362d2d1e-9e77-437f-b400-cb5043d39ef2/")
      .then((response) => {
        console.log("Download-folder API called:", response.data);
      })
      .catch((error) => {
        console.error("Error calling download-folder API:", error);
      });
  }, []);

  // These URLs point to your processed playlists (assumed to be served by your backend or a static server)
  const originalUrl = "http://localhost:3000/output.m3u8";
  const blackoutUrl = "http://localhost:3000/blackout.m3u8";

  return (
    <div>
      <h1>Video Player</h1>
      <VideoPlayer originalUrl={originalUrl} blackoutUrl={blackoutUrl} />
    </div>
  );
}
