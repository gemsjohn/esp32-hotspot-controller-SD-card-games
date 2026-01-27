import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PickachuSim from './mini_games/Pikachu_Sim.jsx'
import CubeCharacterSim from './mini_games/Cube_Character_Sim.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PickachuSim />
  </StrictMode>,
)
