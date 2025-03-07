import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function VideoPlayer({ originalUrl, blackoutUrl }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [segments, setSegments] = useState([]);
  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentManifest, setCurrentManifest] = useState("original");
  const [showOverlay, setShowOverlay] = useState(false);
  const [wasFullScreen, setWasFullScreen] = useState(false);
  const [lastSeekTime, setLastSeekTime] = useState(0);

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
            const duration = parseFloat(lines[i].substring(8).split(",")[0]);
            const file = lines[i + 1] || "";
            const type = file.startsWith("blackout") ? "blackout" : "normal";
            segs.push({
              duration,
              type,
              startTime: cumTime,
              endTime: cumTime + duration,
            });
            cumTime += duration;
            i++;
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
            setWasFullScreen(document.fullscreenElement !== null);
            if (document.fullscreenElement) {
              document.exitFullscreen().catch((err) => console.warn("Exit full-screen error:", err));
            }
            video.pause();
            setShowOverlay(true);
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
        console.log("User is seeking backwards - Reloading video player...");
        setLastSeekTime(seekTime);
        initHls(originalUrl, seekTime);
      } else {
        setLastSeekTime(seekTime);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
    };
  }, [segments, currentSegmentIndex, currentManifest, originalUrl, lastSeekTime]);

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
