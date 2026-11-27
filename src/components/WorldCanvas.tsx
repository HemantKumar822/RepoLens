import { Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { WorldScene } from '../world/WorldScene';
import type { AppPhase, RepositoryData } from '../types';

interface WorldCanvasProps {
  data: RepositoryData | null;
  phase: AppPhase;
  selectedFolder: string | null;
  selectedFile: string | null;
  focusVersion: number;
  onDistrict: (folder: string) => void;
  onFile: (folder: string, path: string) => void;
  onSpirit: (folder: string) => void;
  onFailure: () => void;
}

interface BoundaryProps { children: ReactNode; onFailure: () => void }
interface BoundaryState { failed: boolean }

class CanvasBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch() { this.props.onFailure(); }

  render() { return this.state.failed ? null : this.props.children; }
}

export function WorldCanvas(props: WorldCanvasProps) {
  return (
    <div className="world-canvas" aria-hidden="true">
      <CanvasBoundary onFailure={props.onFailure}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [21, 21, 26], fov: 38, near: 0.1, far: 160 }}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => { gl.setClearColor('#f1a27d'); }}
          fallback={null}
        >
          <WorldScene {...props} />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
