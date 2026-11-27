import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/world.css';
import './styles/hud.css';

const mount = document.getElementById('root');
if (!mount) throw new Error('RepoLens needs a #root element to start.');

createRoot(mount).render(<StrictMode><App /></StrictMode>);
