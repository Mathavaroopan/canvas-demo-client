// VideoPlayer.jsx
import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // If src is undefined or empty, do nothing
    if (!src) {
      console.error("No video source provided.");
      return;
    }

    let hls;
    const video = videoRef.current;
    
    if (video) {
      // Use native HLS support (e.g., Safari)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } 
      // Otherwise, use hls.js for other browsers
      else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        console.error("HLS is not supported in this browser.");
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: "100%", height: "auto", backgroundColor: "#000" }}
    />
  );
};

export default VideoPlayer;
