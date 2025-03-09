import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import VideoUpload from './VideoUpload';
import ShowVideos from './ShowVideos';
import VideoPreview from './VideoPreview';
import ModifyLock from './ModifyLock';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-video" element={<VideoUpload />} />
        <Route path="/show-videos" element={<ShowVideos />} />
        <Route path="/preview" element={<VideoPreview />} />
        <Route path="/modify-videos" element={<ModifyLock />} />
        </Routes>
    </Router>
  );
}
