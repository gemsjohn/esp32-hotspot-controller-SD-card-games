import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Grid,
  useGLTF,
  useAnimations,
  Sparkles
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Noise,
  ChromaticAberration,
  BrightnessContrast,
  HueSaturation,
  ToneMapping
} from '@react-three/postprocessing';
import * as THREE from 'three';

// --- CONFIGURATION ---
// const WS_URL = `ws://${window.location.hostname}:81`;
const WS_URL = `ws://192.168.4.1/ws`;
const JOY_CENTER = 0;
const JOY_MAX = 2048;
const DEADZONE = 200;

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

const settings = {
  grassCount: isMobile ? 800 : 5000,
  shadowRes: isMobile ? 512 : 2048,
  dpr: isMobile ? [1, 1] : [1, 2], // 1x resolution on mobile (pixelated look)
  precision: isMobile ? 'lowp' : 'highp',
  sparkleMultiplier: isMobile ? 0.3 : 1,
};

const normalizeJoystick = (rawVal) => {
  if (rawVal === undefined || rawVal === null) return 0;
  let centered = rawVal - JOY_CENTER;
  if (Math.abs(centered) < DEADZONE) return 0;
  let normalized = (centered / (JOY_MAX / 2)) * 1.25;
  return Math.max(-1, Math.min(1, normalized));
};

const gameData = { j1x: 0, j1y: 0, j2x: 0, j2y: 0, tof1: 0, e: false };

// --- INPUT HANDLERS ---
const WebSocketManager = () => {
  useEffect(() => {
    let socket;
    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.j1x !== undefined) gameData.j1x = normalizeJoystick(data.j1x);
        if (data.j1y !== undefined) gameData.j1y = normalizeJoystick(data.j1y);
        if (data.j2x !== undefined) gameData.j2x = normalizeJoystick(data.j2x);
        if (data.j2y !== undefined) gameData.j2y = normalizeJoystick(data.j2y);
        if (data.tof1 !== undefined) gameData.tof1 = data.tof1;
      };
      socket.onclose = () => setTimeout(connect, 2000);
    };
    connect();
    return () => socket?.close();
  }, []);
  return null;
};

const InputManager = () => {
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'w' || e.key === 'W') gameData.j1y = -1;
      if (e.key === 's' || e.key === 'S') gameData.j1y = 1;
      if (e.key === 'a' || e.key === 'A') gameData.j1x = -1;
      if (e.key === 'd' || e.key === 'D') gameData.j1x = 1;
      if (e.key === 'e' || e.key === 'E') gameData.e = true;
      if (e.key === 'ArrowLeft') gameData.j2x = -1;
      if (e.key === 'ArrowRight') gameData.j2x = 1;
      if (e.key === 'ArrowUp') gameData.j2y = -1; // Jump trigger
      if (e.key === 'ArrowDown') gameData.j2y = 1;
    };
    const up = (e) => {
      if (['w', 's'].includes(e.key)) gameData.j1y = 0;
      if (['W', 'S'].includes(e.key)) gameData.j1y = 0;
      if (['a', 'd'].includes(e.key)) gameData.j1x = 0;
      if (['A', 'D'].includes(e.key)) gameData.j1x = 0;
      if (e.key === 'e' || e.key === 'E') gameData.e = false;
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) gameData.j2x = 0;
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) gameData.j2y = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  return null;
};

const LightningStatic = ({ intensity }) => {
  const linesRef = useRef();

  // Create 5-8 random jagged lines
  const count = 6;
  const lines = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      points: new Float32Array(5 * 3), // 5 points per line
      color: new THREE.Color("#ffff00")
    }));
  }, []);

  useFrame((state) => {
    if (intensity <= 0 || !linesRef.current) return;

    linesRef.current.children.forEach((line, i) => {
      // Jitter logic: only update points occasionally or every frame for "static"
      const positions = line.geometry.attributes.position.array;

      // Starting point near the center
      let x = (Math.random() - 0.5) * 2;
      let y = Math.random() * 3;
      let z = (Math.random() - 0.5) * 2;

      for (let j = 0; j < 5; j++) {
        positions[j * 3] = x;
        positions[j * 3 + 1] = y;
        positions[j * 3 + 2] = z;

        // "Jag" the next point based on intensity
        x += (Math.random() - 0.5) * 1.5 * intensity;
        y += (Math.random() - 0.5) * 1.5 * intensity;
        z += (Math.random() - 0.5) * 1.5 * intensity;
      }
      line.geometry.attributes.position.needsUpdate = true;

      // Flicker opacity
      line.material.opacity = (Math.random() > 0.5 ? 1 : 0.2) * (intensity * 0.8);
    });
  });

  return (
    <group ref={linesRef}>
      {lines.map((_, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={5}
              array={new Float32Array(5 * 3)}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial transparent color="#ffff00" linewidth={2} />
        </line>
      ))}

      {/* High density sparks/static when charging */}
      <Sparkles
        count={Math.floor(intensity * 50 * settings.sparkleMultiplier)}
        scale={3 * intensity}
        size={isMobile ? 1 : 2 + intensity * 5}
        speed={4}
        color="yellow"
      />
    </group>
  );
};

const PlayerPikachu = ({ lightRef, containerRef }) => {
  const meshRef = useRef();
  const [currentAnim, setCurrentAnim] = useState('Idle');
  const [staticIntensity, setStaticIntensity] = useState(0);
  const isJumping = useRef(false);

  const { scene, animations } = useGLTF('/3d_models/pikachu/scene.gltf');
  const { actions } = useAnimations(animations, meshRef);

  useEffect(() => {
    if (actions.Walking) actions.Walking.setEffectiveTimeScale(2.5);
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.material.shadowSide = THREE.BackSide;
      }
    });
  }, [actions, scene]);

  useEffect(() => {
    const action = actions[currentAnim];
    if (action) {
      action.reset().fadeIn(0.2).play();
      return () => action.fadeOut(0.2);
    }
  }, [currentAnim, actions]);

  const camOffset = useMemo(() => new THREE.Vector3(0, 5, 12), []);
  const moveVec = useMemo(() => new THREE.Vector3(), []);
  const idealCamPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!containerRef.current || !meshRef.current) return;

    // A. JUMP LOGIC
    if (gameData.j2y < -0.5 && !isJumping.current) {
      isJumping.current = true;
      setCurrentAnim('Jump');
      setTimeout(() => {
        isJumping.current = false;
        setCurrentAnim('Idle');
      }, actions.Jump.getClip().duration * 1000);
    }

    // B. ANIMATION SELECTOR
    if (!isJumping.current) {
      let nextAnim = (Math.abs(gameData.j1x) > 0.1 || Math.abs(gameData.j1y) > 0.1) ? 'Walking' : 'Idle';
      if (currentAnim !== nextAnim) setCurrentAnim(nextAnim);
    }

    // C. Y-HEIGHT
    let jumpY = 0;
    if (currentAnim === 'Jump' && actions.Jump) {
      const progress = Math.min(actions.Jump.time / actions.Jump.getClip().duration, 1);
      jumpY = Math.sin(progress * Math.PI) * 3;
    }
    setTimeout(() => {
      meshRef.current.position.y = jumpY;
    }, 500)


    // D. GLOW
    const isPressed = gameData.e || gameData.tof1 > 40;
    const targetIntensity = isPressed ? (gameData.tof1 / 200 || 1) : 0;
    // Update local state for the static effect component
    if (Math.abs(staticIntensity - targetIntensity) > 0.05) {
      setStaticIntensity(targetIntensity);
    }

    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.emissive.lerp(new THREE.Color(isPressed ? "#ffff00" : "#000000"), 0.1);
        obj.material.emissiveIntensity = THREE.MathUtils.lerp(obj.material.emissiveIntensity, targetIntensity * 2, 0.1);
      }
    });

    // E. WORLD MOVEMENT
    const turnSpeed = 5 * delta;
    containerRef.current.rotation.y -= gameData.j2x * turnSpeed;
    let moveSpeed = (currentAnim === 'Walking' ? 25 + targetIntensity * 5 : 15) * delta;
    moveVec.set(gameData.j1x / 4, 0, gameData.j1y).applyQuaternion(containerRef.current.quaternion);
    containerRef.current.position.addScaledVector(moveVec, moveSpeed);

    // F. CAMERA
    idealCamPos.copy(camOffset).applyQuaternion(containerRef.current.quaternion).add(containerRef.current.position);
    state.camera.position.lerp(idealCamPos, 0.1);
    state.camera.lookAt(containerRef.current.position.x, 1.5 + jumpY * 0.5, containerRef.current.position.z);

    if (lightRef.current) {
      lightRef.current.position.set(containerRef.current.position.x + 15, 25, containerRef.current.position.z + 15);
      lightRef.current.target.position.copy(containerRef.current.position);
    }
  });

  return (
    <group ref={containerRef} position={[0, 0, 5]}>
      <pointLight
        position={[0, 4, 0]}
        intensity={10 + staticIntensity * 40} // Light pulses with static
        distance={10 + staticIntensity * 5}
        decay={2}
        color={staticIntensity > 0.1 ? "#ffff00" : "#ffffaa"}
      />

      <group ref={meshRef}>
        <primitive object={scene} scale={1.8} rotation={[0, Math.PI, 0]} />

        {/* ADD THE STATIC EFFECT HERE */}
        {staticIntensity > 0.1 && <LightningStatic intensity={staticIntensity} />}
      </group>
    </group>
  );
};


// --- ORIGIN MARKER ---
const OriginMarker = () => {
  const ref = useRef();
  useFrame((state) => {
    ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });
  return (
    <mesh ref={ref} position={[0, 1, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshToonMaterial color="#FF6B6B" />
    </mesh>
  );
};

const ReactiveGrass = ({ playerRef }) => {
  const count = settings.grassCount;
  const meshRef = useRef();

  // 1. Load GLTF - TRY BOTH PATHS (Check your folder structure!)
  const { scene } = useGLTF('/3d_models/low_poly_grass/scene.gltf');

  // 2. Robust Geometry Extraction
  const { grassGeometry, grassMaterial } = useMemo(() => {
    let g = null;
    let m = null;

    scene.traverse((obj) => {
      if (obj.isMesh && !g) { // Grab the first mesh found
        g = obj.geometry.clone(); // Clone to be safe
        m = obj.material.clone();
        console.log("Grass Geometry Found:", g);
      }
    });

    if (m) {
      m.transparent = true;
      m.alphaTest = 0.5;
      m.side = THREE.DoubleSide;
      // Force visibility
      m.opacity = 1;
      m.color.set("#407020");
    }

    return { grassGeometry: g, grassMaterial: m };
  }, [scene]);

  // 3. Fallback Geometry (The "Debug Cube")
  // If the GLTF fails, we use a simple box so we can see the logic working
  const debugGeometry = useMemo(() => new THREE.BoxGeometry(0.2, 2, 0.2), []);
  const debugMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'hotpink' }), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const grassData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 70,
        z: (Math.random() - 0.5) * 70,
        baseScale: 1 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI,
        currentScale: 0 // Start at 0 and grow in
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !playerRef.current) return;

    const playerPos = playerRef.current.position;
    const safeDelta = Math.min(delta, 0.1);

    grassData.forEach((blade, i) => {
      const distSq = (blade.x - playerPos.x) ** 2 + (blade.z - playerPos.z) ** 2;
      const isSteppedOn = distSq < 15;
      const targetScale = isSteppedOn ? 0.01 : blade.baseScale;

      blade.currentScale = THREE.MathUtils.lerp(blade.currentScale, targetScale, 10 * safeDelta);

      dummy.position.set(blade.x, 0, blade.z);

      // Try NO rotation first to see if it shows up
      dummy.rotation.set(-Math.PI / 2, 0, blade.rotation);

      dummy.scale.set(blade.currentScale, blade.currentScale, blade.currentScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      // This logic says: Use the model if it exists, otherwise use the pink box
      args={[grassGeometry || debugGeometry, grassMaterial || debugMaterial, count]}
    />
  );
};

// Preload the model to avoid popping in
useGLTF.preload('/3d_models/low_poly_grass/scene.gltf');

// --- SCENE ---
const Scene = () => {
  const lightRef = useRef();
  const playerContainerRef = useRef(); // We need this shared ref for the 
  return (
    <>
      <WebSocketManager />
      <InputManager />
      <color attach="background" args={['#4ab7ff']} />
      {/* 2. Add the Fog (Match the background color!) */}
      {/* args: [color, density] -> 0.02 is a good starting density */}
      <fogExp2 attach="fog" args={['#4ab7ff', 0.01]} />
      <ambientLight intensity={0.6} color="#ffbf00" />

      <directionalLight
        ref={lightRef}
        castShadow={!isMobile} // Shadows are heavy; consider disabling for mobile
        intensity={1.5}
        shadow-mapSize={settings.shadowRes} // 512 instead of 2048
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.5, 100]} />
      </directionalLight>

      <OriginMarker />
      <ReactiveGrass playerRef={playerContainerRef} />
      <PlayerPikachu lightRef={lightRef} containerRef={playerContainerRef} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#288b14" roughness={1.0} />
      </mesh>

      <Grid infiniteGrid fadeDistance={200} fadeStrength={5} sectionSize={10} sectionColor="#4ECDC4" cellColor="#222222" />

      <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 8}>
        {/* Only use Bloom on Desktop - it's very expensive for mobile GPUs */}
        {!isMobile && <Bloom intensity={1.5} luminanceThreshold={0.5} mipmapBlur />}

        <BrightnessContrast brightness={0.12} contrast={0.4} />

        {/* Skip Noise and Chromatic Aberration on mobile to save draw calls */}
        {!isMobile && (
          <>
            <Noise opacity={0.05} />
            <ChromaticAberration offset={[0.0012, 0.0012]} />
          </>
        )}

        <ToneMapping mode={THREE.ACESFilmicToneMapping} />
      </EffectComposer>
    </>
  );
};


const PokemonControlsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}
      </style>

      <div
        style={{
          position: 'absolute',
          zIndex: 10,
          left: '2rem',
          top: '2rem',
          fontFamily: "'Press Start 2P', cursive",
          userSelect: 'none',
        }}
      >
        {/* The Toggle Button - Styled like a Pokemon Menu Entry */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            backgroundColor: '#fff',
            border: '4px solid #000',
            borderRadius: '4px',
            padding: '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
            width: 'fit-content',
            marginBottom: '8px',
            transition: 'transform 0.1s active',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          {/* The iconic small arrow seen in Pokemon menus */}
          <span style={{
            fontSize: '14px',
            marginRight: '12px',
            visibility: isOpen ? 'visible' : 'hidden'
          }}>▶</span>
          <span style={{ fontSize: '14px', color: '#333' }}>CONTROLS</span>
        </div>

        {/* The Dropdown Content - Styled like a Dialogue Box */}
        {isOpen && (
          <div
            style={{
              padding: '4px',
              backgroundColor: '#000',
              borderRadius: '8px',
              imageRendering: 'pixelated',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                border: '4px solid #706880',
                borderRadius: '6px',
                padding: '20px',
                color: '#333',
                minWidth: '280px',
              }}
            >
              <h2 style={{
                fontSize: '12px',
                marginBottom: '15px',
                color: '#ff1111',
                borderBottom: '2px solid #eee',
                paddingBottom: '8px'
              }}>
                PIKACHU COMMANDS
              </h2>

              <div style={{ fontSize: '10px', lineHeight: '2.2' }}>
                <p style={itemStyle}><span style={keyStyle}>W</span> MOVE FORWARD</p>
                <p style={itemStyle}><span style={keyStyle}>A</span> MOVE LEFT</p>
                <p style={itemStyle}><span style={keyStyle}>D</span> MOVE RIGHT</p>
                <p style={itemStyle}><span style={keyStyle}>S</span> MOVE BACKWARD</p>
                <p style={itemStyle}><span style={keyStyle}>E</span> THUNDERBOLT</p>

                <div style={{
                  marginTop: '15px',
                  fontSize: '8px',
                  color: '#888',
                  borderTop: '2px solid #eee',
                  paddingTop: '10px'
                }}>
                  USE LEFT & RIGHT ARROWS TO LOOK. USE UP ARROW KEY TO JUMP.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

// Layout helpers
const itemStyle = {
  margin: '4px 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const keyStyle = {
  backgroundColor: '#f0f0f0',
  padding: '2px 6px',
  borderRadius: '2px',
  border: '2px solid #333',
  marginRight: '10px',
  color: '#000',
  fontSize: '10px',
  boxShadow: '2px 2px 0px #ccc'
};


export default function PickachuSim() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <PokemonControlsMenu />
      <Canvas
        shadows={!isMobile} // Optional: Disable shadows entirely on mobile for massive boost
        dpr={settings.dpr}
        gl={{
          antialias: !isMobile,
          powerPreference: "high-performance",
          precision: settings.precision,
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 1.2
        }}
        camera={{ fov: 50 }}
      >
        <React.Suspense fallback={null}>
          <Scene />
        </React.Suspense>
      </Canvas>
    </div>
  );
}