import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function VideoPlayer({ originalUrl, blackoutUrl }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [segments, setSegments] = useState([]);
  const [blackoutSegments, setBlackoutSegments] = useState([]);
  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentManifest, setCurrentManifest] = useState("original");
  const [showOverlay, setShowOverlay] = useState(false);
  const [wasFullScreen, setWasFullScreen] = useState(false);
  const [lastSeekTime, setLastSeekTime] = useState(0);
  const [currentBlackoutSegment, setCurrentBlackoutSegment] = useState(null);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const resBlackout = await fetch(blackoutUrl);
        const textBlackout = await resBlackout.text();
        const lines = textBlackout.split("\n").map((line) => line.trim());
        let segs = [];
        let blackoutSegs = [];
        let cumTime = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("#EXTINF:")) {
            const duration = parseFloat(lines[i].substring(8).split(",")[0]);
            const file = lines[i + 1] || "";
            const type = file.startsWith("blackout") ? "blackout" : "normal";
            segs.push({
              duration,
              type,
              startTime: cumTime,
              endTime: cumTime + duration,
            });
            
            // Store blackout segments separately for tracking user choices
            if (type === "blackout") {
              blackoutSegs.push({
                startTime: cumTime,
                endTime: cumTime + duration
              });
            }
            
            cumTime += duration;
            i++;
          }
        }
        setSegments(segs);
        setBlackoutSegments(blackoutSegs);
        setPlaylistLoaded(true);
      } catch (error) {
        console.error("Error fetching playlist:", error);
      }
    }
    fetchPlaylists();
  }, [blackoutUrl]);

  const initHls = (manifestUrl, startTime) => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) {
        resolve();
        return;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
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
      } else if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 1, debug: false, startPosition: startTime });
        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
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

  // Check if time is within a blackout segment
  const isInBlackoutSegment = (time) => {
    for (let i = 0; i < blackoutSegments.length; i++) {
      const segment = blackoutSegments[i];
      if (time >= segment.startTime && time < segment.endTime) {
        return { inBlackout: true, segmentIndex: i };
      }
    }
    return { inBlackout: false, segmentIndex: -1 };
  };

  // Find segment index for a given time
  const findSegmentIndex = (time) => {
    for (let i = 0; i < segments.length; i++) {
      if (time >= segments[i].startTime && time < segments[i].endTime) {
        return i;
      }
    }
    return 0; // Default to first segment if not found
  };

  useEffect(() => {
    if (playlistLoaded && segments.length > 0) {
      initHls(originalUrl, 0);
      setCurrentManifest("original");
      setCurrentSegmentIndex(0);
    }
  }, [playlistLoaded, segments, originalUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || segments.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const currentSeg = segments[currentSegmentIndex];
      if (!currentSeg) return;

      if (currentTime >= currentSeg.endTime - 0.25) {
        const nextIndex = currentSegmentIndex + 1;
        if (nextIndex < segments.length) {
          const nextSeg = segments[nextIndex];

          if (nextSeg.type === "blackout") {
            // Check if this blackout segment still exists in blackoutSegments
            const isStillBlackout = blackoutSegments.some(
              segment => segment.startTime === nextSeg.startTime && segment.endTime === nextSeg.endTime
            );

            if (isStillBlackout) {
              setWasFullScreen(document.fullscreenElement !== null);
              if (document.fullscreenElement) {
                document.exitFullscreen().catch((err) => console.warn("Exit full-screen error:", err));
              }
              video.pause();
              setShowOverlay(true);
              setCurrentBlackoutSegment(blackoutSegments.findIndex(
                segment => segment.startTime === nextSeg.startTime && segment.endTime === nextSeg.endTime
              ));
            } else {
              // This was a blackout segment but user previously chose original
              initHls(originalUrl, nextSeg.startTime);
              setCurrentManifest("original");
              setCurrentSegmentIndex(nextIndex);
            }
          } else {
            if (currentManifest !== "original") {
              initHls(originalUrl, segments[nextIndex].startTime);
              setCurrentManifest("original");
            }
            setCurrentSegmentIndex(nextIndex);
          }
        }
      }
    };

    const handleSeeking = () => {
      const video = videoRef.current;
      if (!video) return;

      const seekTime = video.currentTime;
      console.log(`User seeking to: ${seekTime} seconds`);

      if (seekTime < lastSeekTime) {
        console.log("User is seeking backwards - Checking blackout segments...");
        
        // Check if seeking to a blackout segment
        const { inBlackout, segmentIndex } = isInBlackoutSegment(seekTime);
        
        if (inBlackout) {
          // User is seeking to a blackout segment
          setCurrentBlackoutSegment(segmentIndex);
          setWasFullScreen(document.fullscreenElement !== null);
          
          if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => console.warn("Exit full-screen error:", err));
          }
          
          video.pause();
          setShowOverlay(true);
        } else {
          // Not seeking to a blackout segment, use original manifest
          initHls(originalUrl, seekTime);
          setCurrentManifest("original");
          setCurrentSegmentIndex(findSegmentIndex(seekTime));
        }
      }
      
      setLastSeekTime(seekTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
    };
  }, [segments, blackoutSegments, currentSegmentIndex, currentManifest, originalUrl, lastSeekTime]);

  const handleChoice = async (choice) => {
    if (currentBlackoutSegment === null) return;
    const segment = blackoutSegments[currentBlackoutSegment];
    const segmentIndex = findSegmentIndex(segment.startTime);
    const startTime = segment.startTime;

    if (choice === "original") {
      // Remove this segment from blackoutSegments when user chooses original
      setBlackoutSegments(prev => 
        prev.filter((_, index) => index !== currentBlackoutSegment)
      );
      
      setCurrentManifest("original");
      await initHls(originalUrl, startTime);
    } else {
      // Keep the segment in blackoutSegments when user chooses blackout
      setCurrentManifest("blackout");
      await initHls(blackoutUrl, startTime);
    }

    // Update the current segment index to match where we are now
    setCurrentSegmentIndex(segmentIndex);
    setShowOverlay(false);
    setCurrentBlackoutSegment(null);

    const video = videoRef.current;
    if (wasFullScreen && video) {
      video.requestFullscreen().catch((err) => console.warn("Enter full-screen error:", err));
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#000" }}>
      <video ref={videoRef} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {showOverlay && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 20,
            color: "#fff",
          }}
        >
          <h2 style={{ fontSize: "32px", marginBottom: "20px" }}>Upcoming Blackout</h2>
          <p style={{ fontSize: "20px", marginBottom: "30px" }}>Choose how to continue:</p>
          <div>
            <button onClick={() => handleChoice("lock")} style={styles.choiceButton}>
              Lock (Blackout)
            </button>
            <button onClick={() => handleChoice("original")} style={styles.choiceButton}>
              Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  choiceButton: {
    margin: "0 10px",
    padding: "15px 30px",
    fontSize: "20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#ff5722",
    color: "#fff",
    transition: "background-color 0.3s ease",
  },
};