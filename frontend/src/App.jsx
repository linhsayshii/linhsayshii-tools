import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import IP from './pages/IP';
import QRCode from './pages/QRCode';
import Shortener from './pages/Shortener';
import Downloader from './pages/Downloader';
import Pastebin from './pages/Pastebin';
import PasteView from './pages/PasteView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shortener" element={<Shortener />} />
        <Route path="/downloader" element={<Downloader />} />
        <Route path="/qrcode" element={<QRCode />} />
        <Route path="/ip" element={<IP />} />
        <Route path="/share" element={<Pastebin />} />
        <Route path="/share/:id" element={<PasteView />} />
      </Routes>
    </Router>
  );
}

export default App;
