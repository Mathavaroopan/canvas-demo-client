import React, { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';

const SegmentPlay = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSegments = 12;
  const baseUrl = 'http://localhost:3000';
  const getSegmentUrl = (index) => `${baseUrl}/1-min${index}.ts`;

  const loadSegment = async (index) => {
    if (index >= totalSegments) {
      console.log('All segments played');
      setIsPlaying(false);
      return;
    }

    if (!mpegts.isSupported()) {
      setError('MPEG-TS playback not supported in this browser');
      return;
    }

    try {
      // Clean up previous player
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // Create new configuration
      const config = {
        type: 'mse',  // Use Media Source Extensions
        isLive: false,
        url: getSegmentUrl(index),
        hasAudio: true,
        hasVideo: true,
      };

      const player = mpegts.createPlayer(config);
      player.attachMediaElement(videoRef.current);
      
      player.on(mpegts.Events.ERROR, (err) => {
        console.error('Player error:', err);
        if (err === mpegts.ErrorTypes.NETWORK_ERROR) {
          setError(`Network error loading segment ${index}`);
        } else if (err === mpegts.ErrorTypes.MEDIA_ERROR) {
          setError(`Media error in segment ${index}`);
        } else {
          setError(`Error with segment ${index}: ${err.message}`);
        }
      });

      player.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
        console.log('Media info:', mediaInfo);
      });

      // Wait for loading to complete
      await new Promise((resolve, reject) => {
        player.on(mpegts.Events.LOADING_COMPLETE, resolve);
        player.on(mpegts.Events.ERROR, reject);
        player.load();
      });

      // Start playback
      await videoRef.current.play();
      playerRef.current = player;
      setCurrentIndex(index);
      setError(null);
      setIsPlaying(true);

    } catch (err) {
      console.error('Segment load error:', err);
      setError(`Failed to load segment ${index}: ${err.message}`);
      setIsPlaying(false);
      
      // Try loading next segment if current fails
      if (index < totalSegments - 1) {
        setTimeout(() => loadSegment(index + 1), 1000);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;

    const handleTimeUpdate = () => {
      if (!video.duration || currentIndex >= totalSegments - 1) return;
      
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= 0.5) {
        loadSegment(currentIndex + 1);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    loadSegment(0);
    
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Segment Player</h2>
      {error && (
        <div style={{ 
          color: 'red', 
          margin: '10px 0',
          padding: '10px',
          background: '#ffeeee',
          borderRadius: '4px'
        }}>
          Error: {error}
        </div>
      )}
      <video
        ref={videoRef}
        controls
        style={{ 
          width: '100%', 
          background: '#000',
          marginBottom: '10px'
        }}
      />
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => loadSegment(0)}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Restart
        </button>
        <span>
          Segment {currentIndex + 1} of {totalSegments}
        </span>
      </div>
    </div>
  );
};

export default SegmentPlay;