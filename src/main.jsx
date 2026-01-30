import React, { useEffect, useRef, useState, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import PickachuSim from './mini_games/Pikachu_Sim.jsx'
import CubeCharacterSim from './mini_games/Cube_Character_Sim.jsx'
import PixelEditor from './tools/Pixel_Editor.jsx';
import Map from './tools/Map.jsx';
import WSConnection from './tools/WSConnection.jsx';


function Home() {
  return (<App />);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,
    <BrowserRouter>
      <Routes>
        {/* Separate top-level routes – no nesting */}
        <Route path="/" element={<Home />} /> {/* Home page */}
        <Route path="/pikachu" element={<PickachuSim />} />
        <Route path="/cube-character-sim" element={<CubeCharacterSim />} />
        <Route path="/pixel-editor" element={<PixelEditor />} />
        <Route path="/world-map" element={<Map />} />
        <Route path="/wsconnection" element={<WSConnection />}/>




        {/* <Route path="/editorapp" element={<EditorApp/>} /> */}

      </Routes>
    </BrowserRouter>
);
