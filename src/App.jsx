import React, { useState, useEffect, useRef, Suspense } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
// import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
// import { Experience } from './components/Experience';

const WS_URL = `ws://${window.location.host}/ws`;

const App = ({ isModalOpen = false, isMobile = false }) => {
    const canvasRef = useRef(null);

    // Start with a small empty map
    const [status, setStatus] = useState("Initializing...");

    // Menu state
    const [menu, setMenu] = useState(0);
    // Player state
    const playerRef = useRef({ x: 2, y: 2, dirX: 1, dirY: 0 });

    // 1. FETCH MAP (The Logic for Walls)
    useEffect(() => {
        console.log("React: Attempting to fetch /map...");

        fetch('/')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log("Received the Data:", data);
            })
            .catch(err => {
                console.error("React: Failed to load data.", err);
                // setStatus("Data Load Failed: " + err.message);
                setStatus("Data load failed.")
            });
    }, []);

    // 2. WEBSOCKET (The Logic for Player)
    useEffect(() => {
        const socket = new WebSocket(WS_URL);
        socket.onopen = () => setStatus("Connected (Live)");

        socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                playerRef.current = { x: data.x, y: data.y, dirX: data.dirX, dirY: data.dirY };

                // Handle Game State (Menu/Game)
                if (data.state !== undefined) {
                    setMenu(prev => prev !== data.state ? data.state : prev);
                }

            } catch (err) { }
        };

        socket.onclose = () => setStatus("Disconnected");
        return () => socket.close();
    }, []); // mapData, menu   Re-bind if mapData changes (optional, but good for safety)

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
                {/* 0 = menu, 1 = game, 2 = dedicated server mode */}
                {menu == 1 && (
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
                            onClick={window.location.href = "world-map"}
                        >
                            OTW....
                        </button>
                    </div>
                )}
                {menu == 2 && (
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
                            onClick={() => window.location.href = "pikachu"}
                        >
                            Pikachu <img src="/images/pikachu_icon_000.png" alt="icon of pikachu" height={'50px'}></img>
                        </button>
                        <button
                            style={{
                                margin: '5px 4px',
                            }}
                            onClick={() => window.location.href = "cube-character-sim"}
                        >
                            Cube Character Sim <img src="/images/cardboard_box_001.png" alt="icon of pikachu" height={'50px'}></img>
                        </button>
                    </div>
                )}
            </div>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                textAlign: 'center',
                // padding: '40px 0',
                backgroundColor: '#00000000',
                zIndex: 1
            }}>

                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',

                    textAlign: 'center',
                    // padding: '40px 0',
                    backgroundColor: '#00000000',
                    zIndex: 1,
                    transform: 'translate(0, 30%)'
                }}>
                    <img src="/images/controller_002.png" alt="Picture of a controller" height={'200px'}></img>
                </div>



                {/* <Canvas
                    shadows dpr={[1, 2]}
                    frameloop={isModalOpen ? 'never' : 'always'}
                >

                    <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />

                        <Experience
                            menu={menu}
                            isPaused={isModalOpen}
                            isMobile={isMobile}
                            location={"home"}
                        />

                        <EffectComposer disableNormalPass>
                            <Bloom
                                intensity={1.5}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.9}
                                mipmapBlur
                            />
                            <Noise opacity={0.05} />
                            <ChromaticAberration offset={[0.001, 0.001]} />
                        </EffectComposer>
                    </Suspense>
                </Canvas> */}
            </div>
        </div>
    );
};

export default App;
