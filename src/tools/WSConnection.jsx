import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const TILE_SIZE = 20;
const WS_URL = `ws://${window.location.host}/ws`;

// Color definitions for map tiles
const COLORS = {
    0: null,      // Empty floor (don't draw)
    1: '#888',    // Wall (Grey)
    2: '#ff4444', // Special (Red)
    3: '#44ff44', // Special (Green)
    4: '#4444ff'  // Special (Blue)
};

export default function WSConnection() {
    const canvasRef = useRef(null);

    // Start with a small empty map
    const [status, setStatus] = useState("Initializing...");

    const normalizeJoystick = (rawVal) => {
        if (rawVal === undefined || rawVal === null) return 0;
        let centered = rawVal - JOY_CENTER;
        if (Math.abs(centered) < DEADZONE) return 0;
        let normalized = (centered / (JOY_MAX / 2)) * 1.25;
        return Math.max(-1, Math.min(1, normalized));
    };

    const gameData = useRef({ j1x: 0, j1y: 0, j2x: 0, j2y: 0, tof1: 0, e: false });


    // 2. WEBSOCKET (The Logic for Player)
    useEffect(() => {
        const socket = new WebSocket(WS_URL);
        socket.onopen = () => setStatus("Connected (Live)");

        socket.onmessage = (e) => {
            console.log(e.data);
            try {
                const data = JSON.parse(e.data);

                if (data.j1x !== undefined) gameData.current.j1x = normalizeJoystick(data.j1x);
                if (data.j1y !== undefined) gameData.current.j1y = normalizeJoystick(data.j1y);
                if (data.j2x !== undefined) gameData.current.j2x = normalizeJoystick(data.j2x);
                if (data.j2y !== undefined) gameData.current.j2y = normalizeJoystick(data.j2y);
                if (data.tof1 !== undefined) gameData.current.tof1 = data.tof1;

                // Optional: force re-render when important values change
                // setSomeCounter(c => c+1);
            } catch (err) {
                console.log(err);
            }
        };

        socket.onclose = () => setStatus("Disconnected");
        return () => socket.close();
    }, []);

    return (
        <div style={{ background: '#111', minHeight: '100vh', padding: 20, color: 'white' }}>
            <h1>Status: {status}</h1>
            <div>{`j1x: ${gameData.current.j1x}`}</div>
            <div>{`j1y: ${gameData.current.j1y}`}</div>
            <div>{`j2x: ${gameData.current.j2x}`}</div>
            <div>{`j2y: ${gameData.current.j2y}`}</div>

        </div>
    );
}