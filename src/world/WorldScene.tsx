import { memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CameraControls, Html, type CameraControls as CameraControlsApi } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AppPhase, BuildingLayout, ChildBuildingLayout, DistrictLayout, FileNode, RepositoryData, RepositoryRole } from '../types';
import { spiritForFolder } from '../data/spirits';
import { buildingPlan, layoutWorld, subfolderPlan } from './layout';
import { DistrictBlock, DistrictLandmark, LocalModel, Ocean, WorldLand } from './WorldSetpieces';

const PALETTE: Record<RepositoryRole, string> = {
  source: '#69c77c', tests: '#f07b68', docs: '#f3c55d', config: '#a891e8', other: '#69c4cb',
};
const EMPTY_STRUCTURE: RepositoryData['structure'] = { directories: [], manifests: [], roles: {} };

interface SceneProps {
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

function PixelCloud({ x, y, z, scale = 1, reduceMotion }: { x: number; y: number; z: number; scale?: number; reduceMotion: boolean }) {
  const cloud = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (cloud.current) cloud.current.position.x = reduceMotion ? x : x + Math.sin(clock.elapsedTime * .12 + z) * .3; });
  return <group ref={cloud} position={[x, y, z]} scale={scale}>
    {[[0, 0], [.7, 0], [1.4, 0], [.35, .35], [1.05, .35], [.7, .7]].map(([cx, cy], index) => (
      <mesh key={index} position={[cx, cy, 0]}><boxGeometry args={[.62, .32, .28]} /><meshBasicMaterial color="#ffe2bd" transparent opacity={.54} /></mesh>
    ))}
  </group>;
}

function VoxelSpirit({ color, role, position, onClick, reduceMotion }: { color: string; role: RepositoryRole; position: [number, number, number]; onClick: () => void; reduceMotion: boolean }) {
  const spirit = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (spirit.current) spirit.current.position.y = reduceMotion ? position[1] : position[1] + Math.sin(clock.elapsedTime * 2.1 + position[0]) * .1; });
  return <group ref={spirit} position={position} onClick={(event) => { event.stopPropagation(); onClick(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <mesh position={[0, .1, 0]}><boxGeometry args={[.48, .5, .4]} /><meshStandardMaterial color={color} roughness={.82} /></mesh>
    <mesh position={[0, .56, 0]}><boxGeometry args={[.42, .4, .42]} /><meshStandardMaterial color="#ffdbaf" roughness={.85} /></mesh>
    <mesh position={[-.1, .58, .218]}><boxGeometry args={[.045, .06, .025]} /><meshBasicMaterial color="#214950" /></mesh>
    <mesh position={[.1, .58, .218]}><boxGeometry args={[.045, .06, .025]} /><meshBasicMaterial color="#214950" /></mesh>
    <mesh position={[0, .78, 0]}><boxGeometry args={[.52, .11, .48]} /><meshStandardMaterial color={color} roughness={.82} /></mesh>
    <mesh position={[0, .17, .214]}><boxGeometry args={[.17, .12, .028]} /><meshStandardMaterial color="#f7d68d" roughness={.8} /></mesh>
    {role === 'docs' && <group position={[.29, .23, .05]} rotation={[0, 0, -.08]}><mesh><boxGeometry args={[.16, .24, .12]} /><meshStandardMaterial color="#f0bd59" /></mesh><mesh position={[0, 0, .065]}><boxGeometry args={[.018, .2, .01]} /><meshStandardMaterial color="#fff0c8" /></mesh></group>}
    {role === 'tests' && <mesh position={[.3, .18, .05]}><octahedronGeometry args={[.13, 0]} /><meshStandardMaterial color="#ffd377" emissive="#ed8a5f" emissiveIntensity={.2} /></mesh>}
    {role === 'config' && <group position={[.3, .22, .04]}><mesh><boxGeometry args={[.08, .26, .08]} /><meshStandardMaterial color="#e0d1a0" /></mesh><mesh position={[0, .18, 0]}><sphereGeometry args={[.08, 4, 4]} /><meshStandardMaterial color="#f2c56e" emissive="#efb65f" emissiveIntensity={.18} /></mesh></group>}
    {role === 'source' && <group position={[.3, .19, .04]} rotation={[0, 0, -.3]}><mesh><boxGeometry args={[.06, .25, .06]} /><meshStandardMaterial color="#f2d496" /></mesh><mesh position={[0, .12, 0]}><boxGeometry args={[.19, .06, .06]} /><meshStandardMaterial color="#f2d496" /></mesh></group>}
    <mesh position={[0, -.42, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.34, 12]} /><meshBasicMaterial color="#184b56" transparent opacity={.2} /></mesh>
  </group>;
}

function coloredBox(size: [number, number, number], center: [number, number, number], hex: string) {
  const geometry = new THREE.BoxGeometry(...size).translate(...center);
  const color = new THREE.Color(hex);
  const values = new Float32Array(geometry.attributes.position.count * 3);
  for (let index = 0; index < values.length; index += 3) {
    values[index] = color.r;
    values[index + 1] = color.g;
    values[index + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(values, 3));
  return geometry;
}

function coloredCone(radius: number, height: number, center: [number, number, number], hex: string) {
  const geometry = new THREE.ConeGeometry(radius, height, 4).rotateY(Math.PI / 4).translate(...center);
  const color = new THREE.Color(hex);
  const values = new Float32Array(geometry.attributes.position.count * 3);
  for (let index = 0; index < values.length; index += 3) {
    values[index] = color.r;
    values[index + 1] = color.g;
    values[index + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(values, 3));
  return geometry;
}

function createBuildingGeometry(height: number, width: number, depth: number, kind: string, color: string, variant: number) {
  const walls = ['#f2d0a0', '#e8c79f', '#ddc49e'];
  const wall = kind === 'media' ? '#e7c59d' : walls[variant % walls.length];
  const pieces: THREE.BufferGeometry[] = [coloredBox([width, height, depth], [0, height / 2, 0], wall)];
  if (kind === 'note') {
    pieces.push(coloredBox([width + .12, .12, depth + .12], [0, height + .06, 0], '#efbd56'));
    pieces.push(coloredBox([.15, .24, depth + .12], [-.14, height + .24, 0], '#b97561'));
    pieces.push(coloredBox([.15, .28, depth + .12], [.13, height + .26, 0], '#72a888'));
  } else if (kind === 'plan') {
    pieces.push(coloredBox([width + .1, .13, depth + .1], [0, height + .065, 0], '#9883d9'));
    pieces.push(coloredBox([.11, .24, .11], [0, height + .24, 0], '#6c6688'));
    pieces.push(coloredBox([.34, .08, .16], [0, height + .39, 0], '#e6ce91'));
  } else if (kind === 'test') {
    pieces.push(coloredBox([width + .12, .16, depth + .12], [0, height + .08, 0], '#e97968'));
    pieces.push(coloredBox([width * .42, .24, depth * .42], [0, height + .27, 0], '#f1c77a'));
  } else if (kind === 'media') {
    pieces.push(coloredBox([width + .12, .13, depth + .12], [0, height + .065, 0], '#c786b4'));
    for (const x of [-.15, .15]) pieces.push(coloredBox([.11, .14, depth + .12], [x, height + .2, 0], x < 0 ? '#f3d18e' : '#b978aa'));
  } else {
    if (variant === 0) pieces.push(coloredCone(width * .68, .42, [0, height + .19, 0], color));
    else {
      pieces.push(coloredBox([width + .08, .12, depth + .08], [0, height + .06, 0], color));
      if (variant === 2) pieces.push(coloredBox([.16, .24, .16], [width * .2, height + .24, -depth * .18], '#e6bd76'));
    }
  }
  for (const x of [-width * .24, width * .24]) {
    pieces.push(coloredBox([.065, .08, .018], [x, height * .38, depth / 2 + .008], '#83d7c4'));
    if (height > .82) pieces.push(coloredBox([.065, .08, .018], [x, height * .72, depth / 2 + .008], '#83d7c4'));
  }
  pieces.push(coloredBox([.11, .22, .02], [0, .12, depth / 2 + .012], '#cb8165'));
  const merged = mergeGeometries(pieces, false) || pieces[0];
  pieces.forEach((piece) => { if (piece !== merged) piece.dispose(); });
  return merged;
}

function VoxelBuilding({ file, height, kind, color, index, phase, onClick, reduceMotion, width, depth, rotation, variant }: BuildingLayout & {
  color: string; phase: AppPhase; onClick: () => void; reduceMotion: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const started = useRef(0);
  const geometry = useMemo(() => createBuildingGeometry(height, width, depth, kind, color, variant), [height, width, depth, kind, color, variant]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    const node = root.current;
    if (!node) return;
    if (!started.current) started.current = clock.elapsedTime;
    if (!reduceMotion && phase === 'building') {
      const t = THREE.MathUtils.clamp((clock.elapsedTime - started.current - index * .045) / .48, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      node.scale.y = eased;
    } else node.scale.y = 1;
  });
  return <group ref={root} rotation={[0, rotation, 0]} onClick={(event) => { event.stopPropagation(); onClick(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.86} /></mesh>
  </group>;
}

function FileBuilding({ building, color, phase, reduceMotion, onClick }: {
  building: BuildingLayout; color: string; phase: AppPhase; reduceMotion: boolean; onClick: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const started = useRef(0);
  const modelScale = .57 + Math.min(.16, Math.log10((building.file.size || 0) + 1) * .026);
  useFrame(({ clock }) => {
    const node = root.current;
    if (!node) return;
    if (!started.current) started.current = clock.elapsedTime;
    if (!reduceMotion && phase === 'building') {
      const t = THREE.MathUtils.clamp((clock.elapsedTime - started.current - building.index * .04) / .52, 0, 1);
      node.scale.setScalar(1 - Math.pow(1 - t, 3));
    } else node.scale.setScalar(1);
  });
  return <group ref={root} position={[building.x, .32, building.z]} rotation={[0, building.rotation, 0]}
    onClick={(event) => { event.stopPropagation(); onClick(); }}
    onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
    onPointerOut={() => { document.body.style.cursor = ''; }}>
    <Suspense fallback={<VoxelBuilding {...building} color={color} phase={phase} reduceMotion={reduceMotion} onClick={onClick} />}>
      <LocalModel file={building.asset} scale={modelScale} />
    </Suspense>
  </group>;
}

function ChildBuilding({ building, color, phase, reduceMotion, onClick }: {
  building: ChildBuildingLayout; color: string; phase: AppPhase; reduceMotion: boolean; onClick: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const started = useRef(0);
  useFrame(({ clock }) => {
    const node = root.current;
    if (!node) return;
    if (!started.current) started.current = clock.elapsedTime;
    if (!reduceMotion && phase === 'building') {
      const t = THREE.MathUtils.clamp((clock.elapsedTime - started.current - building.index * .055) / .55, 0, 1);
      node.scale.setScalar(1 - Math.pow(1 - t, 3));
    } else node.scale.setScalar(1);
  });
  const modelScale = .45 + Math.min(.08, Math.log10(building.fileCount + 1) * .025);
  return <group ref={root} position={[building.x, .32, building.z]} rotation={[0, building.rotation, 0]}
    onClick={(event) => { event.stopPropagation(); onClick(); }}
    onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
    onPointerOut={() => { document.body.style.cursor = ''; }}>
    <Suspense fallback={<mesh position={[0, .45, 0]} castShadow><boxGeometry args={[.78, .9, .78]} /><meshStandardMaterial color={color} /></mesh>}>
      <LocalModel file={building.asset} scale={modelScale} />
    </Suspense>
  </group>;
}

const District = memo(function District({ layout, structure, selected, showLabel, phase, onDistrict, onFile, onSpirit, reduceMotion, blockSize }: {
  layout: DistrictLayout; structure: RepositoryData['structure']; selected: boolean; showLabel: boolean;
  phase: AppPhase; onDistrict: (folder: string) => void; onFile: (folder: string, path: string) => void; onSpirit: (folder: string) => void; reduceMotion: boolean; blockSize: number;
}) {
  const root = useRef<THREE.Group>(null);
  const started = useRef(0);
  const { directory, x, z, index } = layout;
  const spirit = spiritForFolder(directory.name, structure);
  const buildings = useMemo(() => buildingPlan(directory.sampleFiles || [], layout, spirit.role), [directory.sampleFiles, layout, spirit.role]);
  const childBuildings = useMemo(() => subfolderPlan(directory, layout, spirit.role), [directory, layout, spirit.role]);
  const blocks = useMemo(() => layout.blocks.map((block) => ({ ...block, x: block.x - x, z: block.z - z })), [layout.blocks, x, z]);
  const tint = PALETTE[spirit.role];
  useFrame(({ clock }) => {
    const node = root.current;
    if (!node) return;
    if (!started.current) started.current = clock.elapsedTime;
    if (!reduceMotion && phase === 'building') {
      const t = THREE.MathUtils.clamp((clock.elapsedTime - started.current - index * .1) / .62, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      node.scale.setScalar(eased);
    } else node.scale.setScalar(1);
  });
  return <group ref={root} position={[x, .12, z]}>
    {blocks.map((block) => <DistrictBlock key={block.index} block={block} blockSize={blockSize} selected={selected} tint={tint} onClick={() => onDistrict(directory.name)} />)}
    {childBuildings.map((building) => <ChildBuilding key={building.name} building={{ ...building, x: building.x - x, z: building.z - z }} color={tint} phase={phase} reduceMotion={reduceMotion} onClick={() => onDistrict(directory.name)} />)}
    {buildings.map((building) => <FileBuilding key={building.file.path} building={{ ...building, x: building.x - x, z: building.z - z }} color={tint} phase={phase} reduceMotion={reduceMotion} onClick={() => onFile(directory.name, building.file.path)} />)}
    <DistrictLandmark role={spirit.role} position={{ x: layout.landmark.x - x, z: layout.landmark.z - z }} onClick={() => onDistrict(directory.name)} />
    {selected && <VoxelSpirit color={tint} role={spirit.role} position={[layout.spirit.x - x, .46, layout.spirit.z - z]} onClick={() => onSpirit(directory.name)} reduceMotion={reduceMotion} />}
    {(showLabel || selected) && <Html position={[0, 3.05, 0]} center distanceFactor={24} zIndexRange={[12, 0]}>
      <button className={`scene-label${selected ? ' is-selected' : ''}`} aria-hidden="true" tabIndex={-1} onClick={(event) => { event.stopPropagation(); onDistrict(directory.name); }}>
        <span className="scene-label-dot" style={{ backgroundColor: tint }} />{directory.name}<small>{directory.fileCount.toLocaleString()} files</small>
      </button>
    </Html>}
  </group>;
});

export const WorldScene = memo(function WorldScene({ data, phase, selectedFolder, selectedFile, focusVersion, onDistrict, onFile, onSpirit }: SceneProps) {
  const directories = useMemo(() => data?.structure.directories.length ? data.structure.directories : data ? [{
    name: 'root', isRepositoryRoot: true, fileCount: data.rootFileCount ?? data.files.filter((file) => !file.path.includes('/')).length,
    children: [], sampleFiles: data.files.filter((file) => !file.path.includes('/')).slice(0, 16),
  }] : [], [data]);
  const structure = data?.structure || EMPTY_STRUCTURE;
  const world = useMemo(() => layoutWorld(
    directories,
    data?.repository.fullName || 'preview-world',
    data?.fileCount || 0,
  ), [data?.fileCount, data?.repository.fullName, directories]);
  const plots = world.districts;
  const labeledFolders = useMemo(() => new Set(directories
    .slice()
    .sort((a, b) => b.fileCount - a.fileCount || a.name.localeCompare(b.name))
    .slice(0, directories.length > 8 ? 6 : directories.length)
    .map((directory) => directory.name)), [directories]);
  const [reduceMotion, setReduceMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const cameraControls = useRef<CameraControlsApi>(null);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(preference.matches);
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);
  useEffect(() => {
    if (!cameraControls.current) return;
    const plot = plots.find((candidate) => candidate.directory.name === selectedFolder);
    const role = plot ? spiritForFolder(plot.directory.name, structure).role : 'other';
    const building = plot && selectedFile ? buildingPlan(plot.directory.sampleFiles || [], plot, role).find((candidate) => candidate.file.path === selectedFile) : null;
    const target = building && plot
      ? new THREE.Vector3(building.x, .62 + building.height * .5, building.z)
      : plot ? new THREE.Vector3(plot.x, .6, plot.z) : new THREE.Vector3(0, .25, 0);
    const viewDirection = new THREE.Vector3(21, 21, 26).normalize();
    const overviewDistance = THREE.MathUtils.clamp(Math.max(world.width, world.depth) * 1.32, 24, 74);
    const distance = building ? 13.5 : plot ? 17.5 : overviewDistance;
    const position = target.clone().addScaledVector(viewDirection, distance);
    void cameraControls.current.setLookAt(position.x, position.y, position.z, target.x, target.y, target.z, !reduceMotion);
  }, [focusVersion, plots, reduceMotion, selectedFile, selectedFolder, structure, world.depth, world.width]);

  return <>
    <color attach="background" args={['#eea17b']} />
    <fog attach="fog" args={['#f0a882', 88, 180]} />
    <ambientLight intensity={1.12} color="#fff3d9" />
    <directionalLight position={[-8, 16, 8]} intensity={2.05} color="#fff0c8" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-near={1} shadow-camera-far={68} shadow-camera-left={-31} shadow-camera-right={31} shadow-camera-top={31} shadow-camera-bottom={-31} shadow-bias={-0.0001} />
    <directionalLight position={[12, 8, -10]} intensity={.62} color="#f38c79" />
    <Ocean world={world} reduceMotion={reduceMotion} />
    <mesh position={[-19, 22, -48]}><sphereGeometry args={[8, 12, 8]} /><meshBasicMaterial color="#f6d081" /></mesh>
    <PixelCloud x={-18} y={11} z={-26} scale={1.5} reduceMotion={reduceMotion} /><PixelCloud x={16} y={15} z={-35} scale={1.15} reduceMotion={reduceMotion} /><PixelCloud x={3} y={18} z={-52} scale={1.8} reduceMotion={reduceMotion} />
    <WorldLand world={world} reduceMotion={reduceMotion} repositoryName={data?.repository.name || 'Code'}>
      <group key={data?.repository.url || 'preview-world'}>
        {plots.map((plot) => <District key={plot.directory.name} layout={plot} structure={structure} selected={selectedFolder === plot.directory.name} showLabel={labeledFolders.has(plot.directory.name)} phase={phase} reduceMotion={reduceMotion} blockSize={world.blockSize} onDistrict={onDistrict} onFile={onFile} onSpirit={onSpirit} />)}
      </group>
    </WorldLand>
    <CameraControls ref={cameraControls} makeDefault minDistance={9} maxDistance={88} minPolarAngle={.38} maxPolarAngle={1.34} smoothTime={reduceMotion ? .001 : .42} draggingSmoothTime={reduceMotion ? .001 : .12} dollyToCursor />
  </>;
});
