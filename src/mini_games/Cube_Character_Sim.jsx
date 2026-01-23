import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  RoundedBox,
  Outlines,
  Grid,
  ContactShadows,
} from '@react-three/drei';
import { EffectComposer, Bloom, Noise, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- CONFIGURATION ---
const WS_URL = `ws://${window.location.hostname}:81`;
const JOY_CENTER = 2048;
const JOY_MAX = 4095;
const DEADZONE = 200;

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
      if (e.key === 'w') gameData.j1y = -1;
      if (e.key === 's') gameData.j1y = 1;
      if (e.key === 'a') gameData.j1x = -1;
      if (e.key === 'd') gameData.j1x = 1;
      if (e.key === 'e' || e.key === 'E') gameData.e = true;
      if (e.key === 'ArrowLeft') gameData.j2x = -1;
      if (e.key === 'ArrowRight') gameData.j2x = 1;
    };
    const up = (e) => {
      if (['w', 's'].includes(e.key)) gameData.j1y = 0;
      if (['a', 'd'].includes(e.key)) gameData.j1x = 0;
      if (e.key === 'e' || e.key === 'E') gameData.e = false; 
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) gameData.j2x = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  return null;
};

// --- ORIGIN MARKER ---
const OriginMarker = () => {
  const ref = useRef();
  useFrame((state) => {
    ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });
  return (
    <RoundedBox ref={ref} args={[1, 1, 1]} radius={0.05} position={[0, 1, 0]}>
      <meshToonMaterial color="#FF6B6B" />
      <Outlines thickness={2} color="black" />
    </RoundedBox>
  );
};

// --- TPS PLAYER (Green Cube) ---
const PlayerCube = ({ lightRef }) => {
  const containerRef = useRef(); 
  const meshRef = useRef();      
  const materialRef = useRef();
  
  const camOffset = useMemo(() => new THREE.Vector3(0, 5, 12), []);
  const moveVec = useMemo(() => new THREE.Vector3(), []);
  const idealCamPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!containerRef.current || !meshRef.current) return;

    // 1. EMISSIVE LOGIC
    if (materialRef.current) {
      const isPressed = gameData.e || gameData.tof1 ? 1 : 0;
      const sensorValue = (gameData.tof1 > 0) ? gameData.tof1/400 : 0.5;
      const targetIntensity = isPressed * (sensorValue * 10);

      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetIntensity,
        0.1
      );
    }

    // 2. MOVEMENT & ROTATION (Container handles World Position/Yaw)
    const turnSpeed = 3 * delta;
    containerRef.current.rotation.y -= gameData.j2x * turnSpeed;
    const isPressed = gameData.e || gameData.tof1 ? 1 : 0;
      const sensorValue = (gameData.tof1 > 0) ? gameData.tof1/400 : 0.5;
      const targetIntensity = isPressed * (sensorValue * 1.25);
    let moveSpeed = (24 * delta) + targetIntensity;
    moveVec.set(gameData.j1x, 0, gameData.j1y).applyQuaternion(containerRef.current.quaternion);
    containerRef.current.position.addScaledVector(moveVec, moveSpeed);

    // 3. LEANING LOGIC (New Feature)
    // We lean the inner mesh based on input. 
    // Forward (j1y < 0) leans X negative. Right (j1x > 0) leans Z negative.
    const maxLean = 0.2; 
    const leanLerpSpeed = 0.1;

    const targetLeanX = gameData.j1y * maxLean;
    const targetLeanZ = -gameData.j1x * maxLean;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetLeanX, leanLerpSpeed);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetLeanZ, leanLerpSpeed);

    // 4. BOUNCE
    const time = state.clock.elapsedTime;
    const isMoving = Math.abs(gameData.j1x) > 0.1 || Math.abs(gameData.j1y) > 0.1;
    meshRef.current.position.y = 0.6 + Math.abs(Math.sin(time * (isMoving ? 10 : 2))) * (isMoving ? 0.3 : 0.05);
    
    // 5. CAMERA & LIGHT
    idealCamPos.copy(camOffset).applyQuaternion(containerRef.current.quaternion).add(containerRef.current.position);
    state.camera.position.lerp(idealCamPos, 0.1);
    state.camera.lookAt(containerRef.current.position.x, 1.5, containerRef.current.position.z);

    if (lightRef.current) {
        lightRef.current.position.set(containerRef.current.position.x + 15, 25, containerRef.current.position.z + 15);
        lightRef.current.target.position.copy(containerRef.current.position);
        lightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <group ref={containerRef} position={[0, 0.5, 5]}>
      <RoundedBox ref={meshRef} args={[2, 2, 2]} radius={0.05} castShadow>
        <meshToonMaterial 
          ref={materialRef}
          color="#4ECDC4" 
          emissive="#4ECDC4"
          toneMapped={false}
        />
        <Outlines thickness={3} color="black" />
      </RoundedBox>
    </group>
  );
};

// --- SCENE ---
const Scene = () => {
  const lightRef = useRef();

  return (
    <>
      <WebSocketManager />
      <InputManager />

      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.4} />

      <directionalLight
        ref={lightRef}
        castShadow
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-25, 25, 25, -25, 0.5, 100]}
        />
      </directionalLight>

      <OriginMarker />
      <PlayerCube lightRef={lightRef} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#222222" roughness={0.8} />
      </mesh>

      <Grid
        infiniteGrid
        fadeDistance={200}
        fadeStrength={5}
        sectionSize={10}
        sectionColor="#4ECDC4"
        cellColor="#444444"
      />

      <EffectComposer disableNormalPass>
        <Bloom intensity={0.8} luminanceThreshold={1.0} mipmapBlur />
        <Noise opacity={0.04} />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </>
  );
};

export default function CubeCharacterSim() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  );
}