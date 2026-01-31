import React, { Suspense, lazy } from 'react' // Import Suspense and lazy
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx';

// LAZY LOAD these heavy components
const PickachuSim = lazy(() => import('./mini_games/Pikachu_Sim.jsx'));
const CubeCharacterSim = lazy(() => import('./mini_games/Cube_Character_Sim.jsx'));
const PixelEditor = lazy(() => import('./tools/Pixel_Editor.jsx'));
const Map = lazy(() => import('./tools/Map.jsx'));
const WSConnection = lazy(() => import('./tools/WSConnection.jsx'));

// Simple loading spinner for when switching tabs
const Loading = () => <div style={{color: 'white'}}>Loading 3D Engine...</div>;

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/pikachu" element={<PickachuSim />} />
        <Route path="/cube-character-sim" element={<CubeCharacterSim />} />
        <Route path="/pixel-editor" element={<PixelEditor />} />
        <Route path="/world-map" element={<Map />} />
        <Route path="/wsconnection" element={<WSConnection />}/>
      </Routes>
    </Suspense>
  </BrowserRouter>
);