import React, { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';

const SegmentPlay = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showNameForm, setShowNameForm] = useState(false);
  const [userName, setUserName] = useState('');
  const [blackoutSegments, setBlackoutSegments] = useState([]);
  const [nextSegmentToPlay, setNextSegmentToPlay] = useState(null);

  const baseUrl = 'http://localhost:3000';
  
  // Calculate total duration from m3u8 file and identify blackout segments
  useEffect(() => {
    fetch(`${baseUrl}/some-name.m3u8`)
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
        let total = 0;
        const blackouts = [];
        let segmentIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('#EXTINF:')) {
            const duration = parseFloat(lines[i].substring(8).split(',')[0]);
            total += duration;
            
            // Check if next line contains blackout segment
            if (lines[i+1]?.includes('blackout_')) {
              blackouts.push(segmentIndex);
            }
            segmentIndex++;
          }
        }
        
        setTotalDuration(total);
        setBlackoutSegments(blackouts);
        loadSegment(0); // Start with first segment
      })
      .catch(err => setError(`Failed to load manifest: ${err.message}`));
  }, []);

  // Set video duration property to show full duration in seekbar
  useEffect(() => {
    if (videoRef.current && totalDuration > 0) {
      Object.defineProperty(videoRef.current, 'duration', {
        writable: true,
        value: totalDuration
      });
    }
  }, [totalDuration, videoRef.current]);

  // Load and play a specific segment
  const loadSegment = (index, isBlackout = false) => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    const prefix = isBlackout ? 'blackout_00' : 'segment_00';
    const url = `${baseUrl}/${prefix}${index}.ts`;
    
    const player = mpegts.createPlayer({
      type: 'mse',
      isLive: false,
      url: url,
      hasAudio: true,
      hasVideo: true,
    });
    
    player.attachMediaElement(videoRef.current);
    player.on(mpegts.Events.ERROR, err => {
      setError(`Error with segment ${index}: ${err.message}`);
    });
    
    player.on(mpegts.Events.LOADING_COMPLETE, () => {
      videoRef.current.play();
      setCurrentIndex(index);
    });
    
    player.load();
    playerRef.current = player;
  };

  // Monitor video playback to handle segment transitions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleEnded = () => {
      const nextIndex = currentIndex + 1;
      
      // Check if next segment is a blackout segment
      if (blackoutSegments.includes(nextIndex)) {
        setNextSegmentToPlay(nextIndex);
        setShowNameForm(true);
      } else {
        loadSegment(nextIndex);
      }
    };
    
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [currentIndex, blackoutSegments]);

  // Handle name form submission
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (userName.trim() === '') return;
    
    setShowNameForm(false);
    if (nextSegmentToPlay !== null) {
      // Play regular segment instead of blackout
      loadSegment(nextSegmentToPlay, false);
      setNextSegmentToPlay(null);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    setShowNameForm(false);
    if (nextSegmentToPlay !== null) {
      // Play blackout segment
      loadSegment(nextSegmentToPlay, true);
      setNextSegmentToPlay(null);
    }
  };

  // Format time (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', position: 'relative' }}>
      <h2>Segment Player</h2>
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffeeee', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          controls
          style={{ width: '100%', background: '#000' }}
        />
      </div>
      
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => loadSegment(0)}
          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Restart
        </button>
        <span>
          Segment {currentIndex + 1} of 12 | Total Duration: {formatTime(totalDuration)}
        </span>
      </div>

      {/* Name submission form for blackout segments */}
      {showNameForm && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          zIndex: 100,
          padding: '20px'
        }}>
          <h3>Please enter your name to continue watching</h3>
          <form onSubmit={handleNameSubmit} style={{ width: '100%', maxWidth: '400px' }}>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              style={{ padding: '12px', width: '100%', marginBottom: '15px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit"
                style={{ 
                  flex: 1,
                  padding: '12px 20px', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Submit & Continue
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                style={{ 
                  flex: 1,
                  padding: '12px 20px', 
                  backgroundColor: '#f44336', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SegmentPlay;