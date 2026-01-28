import React, { useEffect, useRef, useState, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import PickachuSim from './mini_games/Pikachu_Sim.jsx'
import CubeCharacterSim from './mini_games/Cube_Character_Sim.jsx'
import PixelEditor from './tools/Pixel_Editor.jsx';
// import EditorApp from './editor/App.jsx';


function Home() {
  return (<PickachuSim />);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,
    <BrowserRouter>
      <Routes>
        {/* Separate top-level routes – no nesting */}
        <Route path="/" element={<Home />} /> {/* Home page */}
        <Route path="/pikachu" element={<PickachuSim />} /> {/* Pikachu page */}
        <Route path="/cube-character-sim" element={<CubeCharacterSim />} /> {/* Pikachu page */}
        <Route path="/pixel-editor" element={<PixelEditor />} /> {/* Pikachu page */}



        {/* <Route path="/editorapp" element={<EditorApp/>} /> */}

      </Routes>
    </BrowserRouter>
);
