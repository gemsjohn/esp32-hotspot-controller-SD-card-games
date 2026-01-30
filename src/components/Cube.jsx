import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

export const Cube = ({isMobile}) => {
    const meshRef = useRef(null);
    const [clicked, setClicked] = useState(false);
    const isHovering = useRef(true);

    // Load model
    const { scene } = useGLTF('/assets/objects/render_node_controller.glb');

    // Constants
    const SENSITIVITY = 0.5;
    const BOUNCE_FORCE = 0.7;
    const LERP_SPEED = 0.1;
    const ROTATION_OFFSET = Math.PI / 3;
    const BASE_SCALE = isMobile ? 0.15 : 0.25;

    // Pre-create vector objects to avoid garbage collection lag
    const tempTargetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

    // 1. Handle Click Logic
    const handleClick = () => {
        setClicked(true);
        // Reset the bounce after 150ms
        setTimeout(() => setClicked(false), 150);
    };

    // 2. Window tracking logic
    useEffect(() => {
        const handleMouseLeave = () => { isHovering.current = false; };
        const handleMouseEnter = () => { isHovering.current = true; };

        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, []);

    useFrame((state) => {
        const { mouse, clock } = state;
        const time = clock.getElapsedTime();

        if (meshRef.current) {
            // --- ROTATION LOGIC ---
            // Determine where the model WANTs to look
            const targetX = isHovering.current 
                ? (mouse.y * SENSITIVITY) + ROTATION_OFFSET 
                : ROTATION_OFFSET;
                
            const targetY = isHovering.current 
                ? -mouse.x * SENSITIVITY 
                : 0;

            // Idle Wobble
            const wobbleX = Math.sin(time * 0.5) * 0.1;
            const wobbleY = Math.cos(time * 0.3) * 0.1;

            // Apply smooth rotation
            meshRef.current.rotation.x = THREE.MathUtils.lerp(
                meshRef.current.rotation.x,
                targetX + wobbleX,
                LERP_SPEED
            );
            meshRef.current.rotation.y = THREE.MathUtils.lerp(
                meshRef.current.rotation.y,
                targetY + wobbleY,
                LERP_SPEED
            );

            // --- SCALE (BOUNCE) LOGIC ---
            // If clicked is true, set target scale to BOUNCE_FORCE, otherwise 1
            const s = (clicked ? BOUNCE_FORCE : 1) * BASE_SCALE;
            tempTargetScale.set(s, s, s);
            
            // Smoothly lerp to that scale
            meshRef.current.scale.lerp(tempTargetScale, 0.05);
        }
    });

    return (
        <primitive
            ref={meshRef}
            object={scene}
            position={[0, !isMobile ? 1 : 1.4, 0]}
            rotation={[ROTATION_OFFSET, 0, 0]}
            onClick={handleClick}
            
        />
    );
};