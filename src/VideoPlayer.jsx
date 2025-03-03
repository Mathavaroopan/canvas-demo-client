// VideoPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function VideoPlayer({ originalUrl, blackoutUrl }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Array of segments parsed from the blackout playlist
  const [segments, setSegments] = useState([]);
  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  // Which manifest is currently active: "original" or "blackout"
  const [currentManifest, setCurrentManifest] = useState("original");
  // When true, pause playback and show an overlay for user choice
  const [showOverlay, setShowOverlay] = useState(false);

  // Fetch and parse the blackout playlist to determine segment boundaries.
  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const resBlackout = await fetch(blackoutUrl);
        const textBlackout = await resBlackout.text();
        const lines = textBlackout.split("\n").map((line) => line.trim());
        let segs = [];
        let cumTime = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("#EXTINF:")) {
            // Extract duration from the EXTINF line.
            const duration = parseFloat(lines[i].substring(8).split(",")[0]);
            // Next line should be the segment file name.
            const file = lines[i + 1] || "";
            // Mark the segment as "blackout" if its file name starts with "blackout".
            const type = file.startsWith("blackout") ? "blackout" : "normal";
            segs.push({ duration, type, startTime: cumTime, endTime: cumTime + duration });
            cumTime += duration;
            i++; // Skip file name line.
          }
        }
        setSegments(segs);
        setPlaylistLoaded(true);
      } catch (error) {
        console.error("Error fetching playlist:", error);
      }
    }
    fetchPlaylists();
  }, [blackoutUrl]);

  // Helper function to initialize HLS for a given manifest URL starting at a specific time.
  const initHls = (manifestUrl, startTime) => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) {
        resolve();
        return;
      }
      // Clean up any existing HLS instance.
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      // For browsers with native HLS support (e.g., Safari)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = manifestUrl;
        video.addEventListener(
          "loadedmetadata",
          () => {
            video.currentTime = startTime;
            video.play().catch((err) => console.warn("Play error:", err));
            resolve();
          },
          { once: true }
        );
      } 
      // Otherwise, use hls.js with the startPosition option.
      else if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 1, debug: false, startPosition: startTime });
        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // For hls.js, the startPosition config ensures playback starts at the correct time.
          video.play().catch((err) => console.warn("Play error:", err));
          resolve();
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else {
        console.error("HLS not supported on this browser.");
        resolve();
      }
    });
  };

  // When the playlist is loaded, start playback from the beginning using the original manifest.
  useEffect(() => {
    if (playlistLoaded && segments.length > 0) {
      initHls(originalUrl, 0);
      setCurrentManifest("original");
      setCurrentSegmentIndex(0);
    }
  }, [playlistLoaded, segments, originalUrl]);

  // Monitor video playback to decide when to pause and prompt the user.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || segments.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const currentSeg = segments[currentSegmentIndex];
      if (!currentSeg) return;

      // When approaching the end of the current segment (with a small tolerance)
      if (currentTime >= currentSeg.endTime - 0.25) {
        const nextIndex = currentSegmentIndex + 1;
        if (nextIndex < segments.length) {
          const nextSeg = segments[nextIndex];
          // If the next segment is a blackout segment, pause and prompt the user.
          if (nextSeg.type === "blackout") {
            video.pause();
            setShowOverlay(true);
          } else {
            // If not a blackout segment and if not already on the original manifest, switch.
            if (currentManifest !== "original") {
              initHls(originalUrl, segments[nextIndex].startTime);
              setCurrentManifest("original");
            }
            // Advance to the next segment.
            setCurrentSegmentIndex(nextIndex);
          }
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [segments, currentSegmentIndex, currentManifest, originalUrl]);

  // Handler when the user makes a choice for the upcoming segment.
  const handleChoice = async (choice) => {
    const nextIndex = currentSegmentIndex + 1;
    if (nextIndex >= segments.length) return;
    const startTime = segments[nextIndex].startTime;
    if (choice === "lock") {
      setCurrentManifest("blackout");
      await initHls(blackoutUrl, startTime);
    } else {
      setCurrentManifest("original");
      await initHls(originalUrl, startTime);
    }
    setCurrentSegmentIndex(nextIndex);
    setShowOverlay(false);
  };

  return (
    <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
      <video
        ref={videoRef}
        controls
        style={{ width: "100%", backgroundColor: "#000" }}
      />
      {showOverlay && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            color: "#fff",
          }}
        >
          <h2>Upcoming blackout segment</h2>
          <p>Please choose how to continue:</p>
          <div>
            <button
              onClick={() => handleChoice("lock")}
              style={{ margin: "0 10px", padding: "10px 20px" }}
            >
              Lock (Blackout)
            </button>
            <button
              onClick={() => handleChoice("original")}
              style={{ margin: "0 10px", padding: "10px 20px" }}
            >
              Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
