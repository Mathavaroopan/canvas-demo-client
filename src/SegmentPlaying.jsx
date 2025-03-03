// VideoPlayer.js
import React, { useEffect, useRef, useState } from "react";
import mpegts from "mpegts.js";

const VideoPlayer = ({ data, className }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null); // use a ref to hold the player instance
  const [segments, setSegments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch and parse the M3U8 playlist from the blackout URL
  useEffect(() => {
    fetch(data.blackout)
      .then((response) => response.text())
      .then((playlistText) => {
        // Split the playlist into lines and trim them
        const lines = playlistText.split("\n").map((line) => line.trim());
        // Filter out lines that are not TS segment URLs (ignore lines starting with '#')
        const segs = lines.filter((line) => line && !line.startsWith("#"));
        // Convert relative TS segment paths to absolute URLs
        const baseUrl = new URL(data.blackout);
        baseUrl.pathname = baseUrl.pathname.substring(
          0,
          baseUrl.pathname.lastIndexOf("/") + 1
        );
        const absoluteSegments = segs.map(
          (seg) => new URL(seg, baseUrl).href
        );
        setSegments(absoluteSegments);
      })
      .catch((err) => console.error("Error fetching playlist:", err));
  }, [data.blackout]);

  // Create (or re-create) the mpegts.js player for the current segment
  useEffect(() => {
    if (
      segments.length > 0 &&
      currentIndex < segments.length &&
      videoRef.current &&
      mpegts.isSupported()
    ) {
      // If there's an existing player, safely destroy it
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error("Error destroying player:", error);
        }
        playerRef.current = null;
      }
      const currentTsUrl = segments[currentIndex];
      const newPlayer = mpegts.createPlayer({
        type: "mpegts",
        url: currentTsUrl,
      });
      newPlayer.attachMediaElement(videoRef.current);
      newPlayer.load();
      newPlayer
        .play()
        .catch((err) => console.error("Play error:", err));
      playerRef.current = newPlayer;

      // Cleanup function to destroy player when segment changes or component unmounts
      return () => {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (error) {
            console.error("Error during cleanup destroy:", error);
          }
          playerRef.current = null;
        }
      };
    }
  }, [segments, currentIndex]);

  // Handler to continue to the next segment
  const handleContinue = () => {
    if (currentIndex < segments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      console.log("All segments played.");
    }
  };

  return (
    <div className={className}>
      <video ref={videoRef} controls style={{ width: "100%" }} />
      {segments.length > 0 && currentIndex < segments.length && (
        <div style={{ marginTop: "10px" }}>
          <p>
            Now playing segment {currentIndex + 1} of {segments.length}.
          </p>
          {currentIndex < segments.length - 1 && (
            <button onClick={handleContinue}>
              Continue to next segment
            </button>
          )}
          {currentIndex === segments.length - 1 && <p>Last segment is playing.</p>}
        </div>
      )}
      {segments.length === 0 && <p>Loading playlist...</p>}
    </div>
  );
};

export default VideoPlayer;
