import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <NavBar />
      <div style={styles.content}>
        <h1 style={styles.heading}>Welcome to Video Locker</h1>
        <p style={styles.subheading}>Create and preview your processed videos.</p>
        <div style={styles.buttonContainer}>
          <button style={styles.button} onClick={() => navigate("/create-video")}>
            Create Video
          </button>
          <button style={styles.button} onClick={() => navigate("/show-videos")}>
            Preview Videos
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    padding: '20px',
    textAlign: 'center',
  },
  heading: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  subheading: {
    fontSize: '24px',
    marginBottom: '40px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
  },
  button: {
    padding: '15px 30px',
    fontSize: '20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#ff7e67',
    color: '#fff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    transition: 'background-color 0.3s ease',
  },
};
