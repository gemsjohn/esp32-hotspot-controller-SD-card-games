import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, ChromaticAberration } from '@react-three/postprocessing';
import { Experience } from '../components/Experience';

const TILE_SIZE = 20;
const WS_URL = `ws://${window.location.host}/ws`;

const COLORS = {
  0: null,
  1: '#888',
  2: '#ff4444',
  3: '#44ff44',
  4: '#4444ff'
};

const Map = ({ isModalOpen = false, isMobile = false }) => {
  const canvasRef = useRef(null);

  // 1. STATE (For React UI updates like canvas width/height)
  const [mapData, setMapData] = useState({ width: 0, height: 0, data: [] });
  const [status, setStatus] = useState("Initializing...");
  const [menu, setMenu] = useState(1);

  // 2. REFS (For the Game Loop - these are accessible inside Event Listeners)
  // We mirror mapData here so the WebSocket draw loop can see it
  const mapRef = useRef({ width: 0, height: 0, data: [] });
  const playerRef = useRef({ x: 2, y: 2, dirX: 1, dirY: 0 });

  // -------------------------
  // FETCH MAP
  // -------------------------
  useEffect(() => {
    console.log("React: Attempting to fetch /map...");
    fetch('/map')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("Map Data Received:", data);

        // Update React State (triggers re-render to resize canvas DOM)
        setMapData(data);

        // Update Ref (makes data immediately available to the draw loop)
        mapRef.current = data;

        // Force a draw immediately after loading
        draw();
      })
      .catch(err => {
        console.error("React: Failed to load data.", err);
        setStatus("Data load failed.");
      });
  }, []);

  // -------------------------
  // WEBSOCKET
  // -------------------------
  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socket.onopen = () => setStatus("Connected (Live)");

    socket.onmessage = (e) => {
      // DO NOT setMapData here. It will overwrite the map with player data.
      try {
        const data = JSON.parse(e.data);

        // Update Player Ref
        playerRef.current = { x: data.x, y: data.y, dirX: data.dirX, dirY: data.dirY };

        // Handle Game State (Menu/Game)
        if (data.state !== undefined) {
          setMenu(prev => prev !== data.state ? data.state : prev);
        }

        // Trigger Draw
        draw();

      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    socket.onclose = () => setStatus("Disconnected");
    return () => socket.close();
  }, []); // Empty dependency array = No infinite oscillation

  // -------------------------
  // DRAW LOOP
  // -------------------------
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // READ FROM REF, NOT STATE
    // This ensures we always have the latest data, even inside the WS listener
    const currentMap = mapRef.current;
    const p = playerRef.current;

    // Clear
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    if (currentMap.width > 0 && currentMap.data.length > 0) {
      for (let y = 0; y < currentMap.height; y++) {
        for (let x = 0; x < currentMap.width; x++) {
          const i = (y * currentMap.width) + x;
          const tileVal = currentMap.data[i];

          if (tileVal > 0) {
            ctx.fillStyle = COLORS[tileVal] || '#fff';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    } else {
      ctx.fillStyle = "red";
      ctx.fillText("NO MAP DATA", 20, 30);
    }

    // Draw Player
    const px = p.x * TILE_SIZE;
    const py = p.y * TILE_SIZE;

    ctx.fillStyle = "#0088FF";
    ctx.beginPath();
    ctx.arc(px, py, TILE_SIZE / 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + (p.dirX * 15), py + (p.dirY * 15));
    ctx.stroke();
  };

  return (
    <div>
      <div
        style={{
          background: '#11111100', padding: 20,
          color: 'white', zIndex: 2, position: 'absolute',
          top: 0, left: 0
        }}
      >
        <p>Status: {status}</p>
        <p>Menu State: {menu}</p>
        {menu == 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '300px',
            }}
          >
            <button
              style={{
                margin: '5px 4px',
              }}
              onClick={window.location.href = "/"}
            >
              OTW....
            </button>
          </div>
        )}
        <div
          style={{
            position: 'absolute', top: 0, left: 0,
            transform: 'translate(50%, 15%)'
          }}
        >
          {/* We still use mapData state here for the DOM width/height properties */}
          <canvas
            ref={canvasRef}
            width={Math.max(300, mapData.width * TILE_SIZE)}
            height={Math.max(300, mapData.height * TILE_SIZE)}
            style={{ border: '2px solid #555' }}
          />
        </div>
      </div>

      {/* 3D Background */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        textAlign: 'center', backgroundColor: '#00000000',
        zIndex: 1
      }}>
        <Canvas shadows dpr={[1, 2]} frameloop={isModalOpen ? 'never' : 'always'}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
            <Experience isPaused={isModalOpen} isMobile={isMobile} location={"map"} />
            <EffectComposer disableNormalPass>
              <Bloom intensity={1.5} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
              <Noise opacity={0.05} />
              <ChromaticAberration offset={[0.001, 0.001]} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default Map;