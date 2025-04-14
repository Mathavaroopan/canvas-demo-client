import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import VideoUpload from './VideoUpload';
import ShowVideos from './ShowVideos';
import VideoPreview from './VideoPreview';
import ModifyLock from './ModifyLock';
import Register from './Register';
import Login from './Login';
import NavBar from './NavBar';
import './App.css';
import SegmentPlay from './SegmentPlay';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <NavBar />
        <main className="page">
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create-video" element={<VideoUpload />} />
              <Route path="/show-videos" element={<ShowVideos />} />
              <Route path="/preview" element={<VideoPreview />} />
              <Route path="/modify-videos" element={<ModifyLock />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
