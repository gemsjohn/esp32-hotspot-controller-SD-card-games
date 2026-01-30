
import React from 'react';
import { SpotLight, Cloud, Stars, Float } from '@react-three/drei';
// import { Volumetrics } from './Volumetrics';
import { Cube } from './Cube';

// Fix: Define intrinsic elements as local components to bypass JSX.IntrinsicElements type checking
const AmbientLight = 'ambientLight';
const PointLight = 'pointLight';
const Mesh = 'mesh';
const PlaneGeometry = 'planeGeometry';
const MeshStandardMaterial = 'meshStandardMaterial';

export const Experience = ({ isPaused, isMobile, location }) => {
  return (
    <>
      {/* Main Cinematic Spotlight */}
      <SpotLight
        position={[0, 12, 0]}
        angle={0.25}
        penumbra={1}
        distance={20}
        intensity={isPaused ? 0 : 500} // Optional: dim lights when paused
        color="#ffffff"
        castShadow
        shadow-bias={-0.0001}
      />

      {/* Subtle Fill Light */}
      {/* Fix: use AmbientLight and PointLight local components */}
      <AmbientLight intensity={0.05} />
      <PointLight position={[0, 1, 5]} intensity={5} color="#4444ff" />

      {location === "home" && (
        <>
          {/* The Floating Cube */}
          <Float
            speed={1.5}
            rotationIntensity={0.5}
            floatIntensity={0.5}
          >
            <Cube isMobile={isMobile} />
          </Float>
        </>

      )}


      {/* Volumetric Smoke/Atmosphere */}
      {/* {!isMobile && (
        <Volumetrics isPaused={isPaused} isMobile={isMobile} />
      )} */}


      {/* Distant detail */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Floor to catch shadows and create depth */}
      {/* Fix: use Mesh, PlaneGeometry, and MeshStandardMaterial local components */}
      {/* <Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
        <PlaneGeometry args={[100, 100]} />
        <MeshStandardMaterial 
          color="#111111" 
          roughness={1} 
          metalness={0.1} 
          transparent 
          opacity={0.5}
        />
      </Mesh> */}
    </>
  );
};
