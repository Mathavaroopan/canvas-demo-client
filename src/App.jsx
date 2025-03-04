import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VideoUpload from './VideoUpload';
import VideoPreview from './VideoPreview';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VideoUpload />} />
        <Route path="/preview" element={<VideoPreview />} />
      </Routes>
    </Router>
  );
}
