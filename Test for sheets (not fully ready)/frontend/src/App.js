import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GoogleSheetEmbed from './pages/GoogleSheetEmbed';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sheet-embed" element={<GoogleSheetEmbed />} />
      </Routes>
    </Router>
  );
}

export default App;
