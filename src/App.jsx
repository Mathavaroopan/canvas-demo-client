import React from "react";
import VideoPlayer from "./VideoPlayer";

export default function App() {
  const originalUrl = "http://localhost:8000/output.m3u8";
  const blackoutUrl = "http://localhost:8000/blackout.m3u8";

  return (
    <div>
      <h1>Video Player</h1>
      <VideoPlayer originalUrl={originalUrl} blackoutUrl={blackoutUrl} />
    </div>
  );
}
