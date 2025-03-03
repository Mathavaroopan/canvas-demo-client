import React from "react";
import VideoPlayer from "./VideoPlayer";

export default function App() {
  const videoUrl = "http://localhost:8000/output.m3u8";

  return (
    <div>
      <h1>Video Player</h1>
      <VideoPlayer src={videoUrl} />
    </div>
  );
}
