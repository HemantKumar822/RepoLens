import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CityBlock, RepositoryRole, WorldLayout, WorldPoint, WorldRoad } from '../types';

const CITY_MODELS = [
  'office', 'corner-shop', 'market', 'restaurant', 'library', 'school', 'monument',
  'townhouse', 'apartments', 'tree-ipe', 'tree-araucaria', 'bench', 'streetlight', 'taxi',
];
const ASSET_URL = (name: string) => `/assets/city/${name}.glb`;
const LOT_GRID_LINES = [-2.13, -.71, .71, 2.13];
CITY_MODELS.forEach((name) => useGLTF.preload(ASSET_URL(name)));

export function LocalModel({ file, position = [0, 0, 0], scale = .65, rotation = 0 }: {
  file: string; position?: [number, number, number]; scale?: number; rotation?: number;
}) {
  const { scene } = useGLTF(ASSET_URL(file));
  const instance = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    instance.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [instance]);
  return <primitive object={instance} position={position} rotation-y={rotation} scale={scale} dispose={null} />;
}

function islandShape(outline: WorldPoint[]) {
  const shape = new THREE.Shape();
  outline.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.z);
    else shape.lineTo(point.x, point.z);
  });
  shape.closePath();
  return shape;
}

function roadRibbon(roads: WorldRoad[], y: number, extraWidth = 0) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const road of roads) {
    const dx = road.end.x - road.start.x;
    const dz = road.end.z - road.start.z;
    const length = Math.hypot(dx, dz);
    if (length < .05) continue;
    const half = ((road.width || 1) + extraWidth) / 2;
    const ox = -dz / length * half;
    const oz = dx / length * half;
    const base = positions.length / 3;
    positions.push(
      road.start.x + ox, y, road.start.z + oz,
      road.start.x - ox, y, road.start.z - oz,
      road.end.x - ox, y, road.end.z - oz,
      road.end.x + ox, y, road.end.z + oz,
    );
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function beachRing(outline: WorldPoint[]) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index < outline.length; index += 1) {
    const point = outline[index];
    const next = outline[(index + 1) % outline.length];
    const base = positions.length / 3;
    positions.push(
      point.x, .12, point.z,
      point.x * .963, .12, point.z * .963,
      next.x, .12, next.z,
      next.x * .963, .12, next.z * .963,
    );
    indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function DistrictBlockSurface({ block, blockSize, selected, tint, onClick }: {
  block: CityBlock; blockSize: number; selected: boolean; tint: string; onClick: () => void;
}) {
  const lotColor = new THREE.Color('#d0c9a8').lerp(new THREE.Color(tint), selected ? .18 : .1).getStyle();
  const sidewalkColor = selected ? '#ead9b1' : '#ddd0b0';
  return <group position={[block.x, 0, block.z]} onClick={(event) => { event.stopPropagation(); onClick(); }}
    onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <mesh position={[0, .17, 0]} receiveShadow castShadow><boxGeometry args={[blockSize, .18, blockSize]} /><meshStandardMaterial color="#c4b596" roughness={.98} /></mesh>
    <mesh position={[0, .275, 0]} receiveShadow><boxGeometry args={[blockSize - .38, .04, blockSize - .38]} /><meshStandardMaterial color={sidewalkColor} roughness={.96} /></mesh>
    <mesh position={[0, .302, 0]} receiveShadow><boxGeometry args={[blockSize - 1.02, .025, blockSize - 1.02]} /><meshStandardMaterial color={lotColor} roughness={1} /></mesh>
    {LOT_GRID_LINES.map((offset) => <group key={offset}>
      <mesh position={[offset, .32, 0]}><boxGeometry args={[.025, .012, 5.68]} /><meshStandardMaterial color="#aa9a79" transparent opacity={.52} roughness={1} /></mesh>
      <mesh position={[0, .32, offset]}><boxGeometry args={[5.68, .012, .025]} /><meshStandardMaterial color="#aa9a79" transparent opacity={.52} roughness={1} /></mesh>
    </group>)}
    <mesh position={[0, .32, -blockSize / 2 + .34]}><boxGeometry args={[blockSize - .62, .022, .06]} /><meshStandardMaterial color={tint} roughness={.9} /></mesh>
  </group>;
}

function PixelTree({ scale = 1 }: { scale?: number }) {
  return <group scale={scale}>
    <mesh position={[0, .38, 0]} castShadow><boxGeometry args={[.28, .76, .28]} /><meshStandardMaterial color="#85634b" roughness={1} /></mesh>
    <mesh position={[0, .83, 0]} castShadow><boxGeometry args={[.92, .52, .84]} /><meshStandardMaterial color="#78ad72" roughness={1} /></mesh>
    <mesh position={[0, 1.18, 0]} castShadow><boxGeometry args={[.66, .42, .64]} /><meshStandardMaterial color="#91bd72" roughness={1} /></mesh>
    <mesh position={[0, 1.47, 0]}><boxGeometry args={[.35, .22, .34]} /><meshStandardMaterial color="#b7d181" roughness={1} /></mesh>
  </group>;
}

function ParkBlock({ block, blockSize }: { block: CityBlock; blockSize: number }) {
  const edge = blockSize - .42;
  const treeFile = block.seed % 2 ? 'tree-ipe' : 'tree-araucaria';
  const trees = [[-2.35, -2.35], [2.35, -2.35], [-2.35, 2.35], [2.35, 2.35]];
  return <group position={[block.x, 0, block.z]}>
    <mesh position={[0, .17, 0]} receiveShadow castShadow><boxGeometry args={[blockSize, .18, blockSize]} /><meshStandardMaterial color="#c4b596" roughness={.98} /></mesh>
    <mesh position={[0, .275, 0]} receiveShadow><boxGeometry args={[edge, .04, edge]} /><meshStandardMaterial color="#82b57e" roughness={1} /></mesh>
    <mesh position={[0, .303, 0]}><boxGeometry args={[.82, .018, edge]} /><meshStandardMaterial color="#e3d3ad" roughness={.98} /></mesh>
    <mesh position={[0, .305, 0]}><boxGeometry args={[edge, .018, .82]} /><meshStandardMaterial color="#e3d3ad" roughness={.98} /></mesh>
    {trees.map(([x, z], index) => <group key={`tree-${index}`} position={[x, .31, z]}>
      <Suspense fallback={<PixelTree scale={.7} />}><LocalModel file={index % 2 ? treeFile : 'tree-ipe'} scale={.68 + (index % 3) * .06} /></Suspense>
    </group>)}
    {[-1, 1].map((side) => <group key={`bench-${side}`} position={[side * 2.2, .31, 0]} rotation-y={side < 0 ? Math.PI / 2 : -Math.PI / 2}>
      <Suspense fallback={null}><LocalModel file="bench" scale={.46} /></Suspense>
    </group>)}
    <group position={[0, .31, -2.25]}>
      <Suspense fallback={null}><LocalModel file="streetlight" scale={.55} /></Suspense>
    </group>
  </group>;
}

function TownSquare({ block, blockSize, repositoryName }: { block: CityBlock; blockSize: number; repositoryName: string }) {
  return <group position={[block.x, 0, block.z]}>
    <mesh position={[0, .16, 0]} receiveShadow castShadow><boxGeometry args={[blockSize, .18, blockSize]} /><meshStandardMaterial color="#c3ae89" roughness={.98} /></mesh>
    <mesh position={[0, .272, 0]} receiveShadow><boxGeometry args={[blockSize - .38, .04, blockSize - .38]} /><meshStandardMaterial color="#e4d5b2" roughness={.92} /></mesh>
    <mesh position={[0, .3, 0]} receiveShadow><boxGeometry args={[blockSize - 1.1, .035, blockSize - 1.1]} /><meshStandardMaterial color="#d3bf99" roughness={.94} /></mesh>
    <mesh position={[0, .35, 0]} castShadow receiveShadow><boxGeometry args={[2.1, .1, 2.1]} /><meshStandardMaterial color="#bfa782" roughness={.9} /></mesh>
    <mesh position={[0, .54, 0]} castShadow><boxGeometry args={[1.42, .34, 1.42]} /><meshStandardMaterial color="#efe0b8" roughness={.88} /></mesh>
    <Suspense fallback={<mesh position={[0, 1.03, 0]} castShadow><octahedronGeometry args={[.46, 0]} /><meshStandardMaterial color="#e9a34f" emissive="#f0a44e" emissiveIntensity={.22} roughness={.5} /></mesh>}>
      <LocalModel file="monument" position={[0, .56, 0]} scale={.54} />
    </Suspense>
    {[[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].map(([x, z], index) => <group key={index} position={[x, .3, z]}>
      <mesh position={[0, .04, 0]}><boxGeometry args={[.16, .12, .16]} /><meshStandardMaterial color="#9c805a" /></mesh>
      <mesh position={[0, .17, 0]}><boxGeometry args={[.1, .1, .1]} /><meshStandardMaterial color="#ffdf8e" emissive="#f0a44e" emissiveIntensity={.35} /></mesh>
    </group>)}
    <group position={[-2.72, .31, .25]} rotation-y={Math.PI / 2}><Suspense fallback={null}><LocalModel file="bench" scale={.44} /></Suspense></group>
    <group position={[2.72, .31, -.25]} rotation-y={-Math.PI / 2}><Suspense fallback={null}><LocalModel file="bench" scale={.44} /></Suspense></group>
    <Html position={[0, 1.55, 0]} center distanceFactor={29}><div className="town-sign">{repositoryName.toUpperCase()} / COMMONS</div></Html>
  </group>;
}

function RoadNetwork({ world }: { world: WorldLayout }) {
  const geometry = useMemo(() => ({
    road: roadRibbon(world.avenues, .205),
    shoulders: roadRibbon(world.avenues, .194, .28),
    beach: beachRing(world.outline),
  }), [world.avenues, world.outline]);
  const laneDashes = useMemo(() => world.avenues.flatMap((road, roadIndex) => {
    const dx = road.end.x - road.start.x;
    const dz = road.end.z - road.start.z;
    const length = Math.hypot(dx, dz);
    const count = Math.max(0, Math.floor(length / 2.25) - 1);
    return Array.from({ length: count }, (_, index) => {
      const amount = (index + 1) / (count + 1);
      return {
        key: `${roadIndex}-${index}`,
        x: road.start.x + dx * amount,
        z: road.start.z + dz * amount,
        rotation: Math.abs(dx) > Math.abs(dz) ? 0 : Math.PI / 2,
      };
    });
  }), [world.avenues]);
  useEffect(() => () => Object.values(geometry).forEach((item) => item.dispose()), [geometry]);
  return <group>
    <mesh geometry={geometry.beach}><meshStandardMaterial color="#e4c98e" roughness={1} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={geometry.shoulders} receiveShadow><meshStandardMaterial color="#cabd9e" roughness={.98} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={geometry.road} receiveShadow><meshStandardMaterial color="#727b75" roughness={.94} side={THREE.DoubleSide} /></mesh>
    {laneDashes.map((dash) => <mesh key={dash.key} position={[dash.x, .214, dash.z]} rotation-y={dash.rotation}>
      <boxGeometry args={[.52, .012, .055]} /><meshBasicMaterial color="#e5cc85" />
    </mesh>)}
    {world.crossings.map((crossing, index) => <group key={index} position={[crossing.x, .218, crossing.z]}>
      {[-.4, -.2, 0, .2, .4].map((offset) => <mesh key={`h-${offset}`} position={[0, 0, offset]}>
        <boxGeometry args={[.38, .016, .07]} /><meshBasicMaterial color="#efe2c2" />
      </mesh>)}
      {[-.4, -.2, 0, .2, .4].map((offset) => <mesh key={`v-${offset}`} position={[offset, 0, 0]} rotation-y={Math.PI / 2}>
        <boxGeometry args={[.38, .016, .07]} /><meshBasicMaterial color="#efe2c2" />
      </mesh>)}
    </group>)}
  </group>;
}

function TaxiCourier({ route, index, reduceMotion }: { route: WorldRoad; index: number; reduceMotion: boolean }) {
  const courier = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const node = courier.current;
    if (!node) return;
    const duration = 16 + index * 3;
    const progress = reduceMotion ? .3 + index * .24 : (clock.elapsedTime / duration + index * .37) % 1;
    const dx = route.end.x - route.start.x;
    const dz = route.end.z - route.start.z;
    node.position.set(route.start.x + dx * progress, .24, route.start.z + dz * progress);
    node.rotation.y = Math.abs(dx) > Math.abs(dz) ? -Math.PI / 2 : 0;
  });
  return <group ref={courier}>
    <Suspense fallback={<group><mesh position={[0, .14, 0]} castShadow><boxGeometry args={[.8, .25, .42]} /><meshStandardMaterial color="#e7a344" /></mesh><mesh position={[0, .31, 0]}><boxGeometry args={[.46, .13, .34]} /><meshStandardMaterial color="#f1d9a8" /></mesh></group>}>
      <LocalModel file="taxi" scale={.45} />
    </Suspense>
  </group>;
}

function CityTraffic({ world, reduceMotion }: { world: WorldLayout; reduceMotion: boolean }) {
  const route = world.avenues.find((road) => road.kind === 'avenue' && Math.abs(road.start.z - road.end.z) < .01);
  return route ? <TaxiCourier route={route} index={0} reduceMotion={reduceMotion} /> : null;
}

function FallbackLandmark({ role }: { role: RepositoryRole }) {
  const colors: Record<RepositoryRole, string> = {
    source: '#53a875', tests: '#dd8066', docs: '#e2b752', config: '#9284ca', other: '#65aeb1',
  };
  return <group>
    <mesh position={[0, .42, 0]} castShadow><boxGeometry args={[1.2, .8, 1.15]} /><meshStandardMaterial color="#ebd2a2" roughness={.9} /></mesh>
    <mesh position={[0, .88, 0]} castShadow><boxGeometry args={[1.36, .14, 1.3]} /><meshStandardMaterial color={colors[role]} roughness={.9} /></mesh>
    <mesh position={[0, 1.16, 0]} castShadow><coneGeometry args={[.52, .42, 4]} /><meshStandardMaterial color={colors[role]} roughness={.9} /></mesh>
  </group>;
}

function LandmarkAsset({ role }: { role: RepositoryRole }) {
  const file = role === 'tests' ? 'school'
    : role === 'docs' ? 'library'
      : role === 'config' ? 'office'
        : role === 'source' ? 'corner-shop' : 'townhouse';
  return <LocalModel file={file} scale={.7} />;
}

export function DistrictBlock({ block, blockSize, selected, tint, onClick }: {
  block: CityBlock; blockSize: number; selected: boolean; tint: string; onClick: () => void;
}) {
  return <DistrictBlockSurface block={block} blockSize={blockSize} selected={selected} tint={tint} onClick={onClick} />;
}

export function DistrictLandmark({ role, position, onClick }: { role: RepositoryRole; position: WorldPoint; onClick: () => void }) {
  return <group position={[position.x, .32, position.z]} onClick={(event) => { event.stopPropagation(); onClick(); }}
    onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <Suspense fallback={<FallbackLandmark role={role} />}><LandmarkAsset role={role} /></Suspense>
  </group>;
}

export function Ocean({ world, reduceMotion }: { world: WorldLayout; reduceMotion: boolean }) {
  const ripples = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ripples.current) ripples.current.position.z = reduceMotion ? 0 : Math.sin(clock.elapsedTime * .22) * .18; });
  const wavelets = useMemo(() => world.outline
    .filter((_, index) => index % 2 === 0)
    .map((point, index) => {
      const angle = Math.atan2(point.z, point.x);
      const radius = 1.045 + (index % 3) * .012;
      return { x: point.x * radius, z: point.z * radius, angle, scale: .62 + index % 3 * .12 };
    }), [world.outline]);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[Math.max(180, world.width * 4), Math.max(180, world.depth * 4)]} /><meshStandardMaterial color="#38aeb0" roughness={.96} />
    </mesh>
    <group ref={ripples} position={[0, -1.46, 0]}>
      {wavelets.map(({ x, z, angle, scale }, index) => <mesh key={index} rotation={[-Math.PI / 2, 0, angle]} position={[x, 0, z]} scale={scale}>
        <ringGeometry args={[.22, .28, 8]} /><meshBasicMaterial color={index % 2 ? '#a4e2c8' : '#6dcfc7'} transparent opacity={.4} side={THREE.DoubleSide} />
      </mesh>)}
    </group>
    <HarborCourier world={world} reduceMotion={reduceMotion} />
  </>;
}

function HarborCourier({ world, reduceMotion }: { world: WorldLayout; reduceMotion: boolean }) {
  const boat = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!boat.current) return;
    const travel = reduceMotion ? .5 : (clock.elapsedTime * .34) % 1;
    boat.current.position.set((travel - .5) * world.width * .8, -1.43, world.depth / 2 + 1.15 + Math.sin(travel * Math.PI * 2) * .4);
    boat.current.rotation.y = reduceMotion ? 0 : Math.sin(travel * Math.PI * 2) * .035;
  });
  return <group ref={boat}>
    <mesh position={[0, .02, 0]} castShadow><boxGeometry args={[1.4, .22, .58]} /><meshStandardMaterial color="#9c5d52" roughness={.85} /></mesh>
    <mesh position={[0, .18, 0]}><boxGeometry args={[.84, .12, .42]} /><meshStandardMaterial color="#e4b66c" roughness={.88} /></mesh>
    <mesh position={[-.08, .62, 0]}><boxGeometry args={[.06, 1, .06]} /><meshStandardMaterial color="#705b4c" /></mesh>
    <mesh position={[-.3, .63, 0]}><planeGeometry args={[.58, .72]} /><meshBasicMaterial color="#ffe9b7" side={THREE.DoubleSide} /></mesh>
    <mesh position={[.34, .43, 0]}><planeGeometry args={[.42, .48]} /><meshBasicMaterial color="#e99070" side={THREE.DoubleSide} /></mesh>
  </group>;
}

export function WorldLand({ world, children, reduceMotion, repositoryName }: {
  world: WorldLayout; children: ReactNode; reduceMotion: boolean; repositoryName: string;
}) {
  const land = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const shape = islandShape(world.outline);
    const extruded = new THREE.ExtrudeGeometry(shape, { depth: 1.05, bevelEnabled: false, steps: 1, curveSegments: 1 });
    extruded.rotateX(Math.PI / 2);
    extruded.computeVertexNormals();
    return extruded;
  }, [world.outline]);
  const material = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#83b978', roughness: .98 }),
    new THREE.MeshStandardMaterial({ color: '#a46d53', roughness: 1 }),
  ], []);
  const plaza = world.blocks.find((block) => block.kind === 'plaza');
  const parks = world.blocks.filter((block) => block.kind === 'park');
  useEffect(() => () => { geometry.dispose(); material.forEach((item) => item.dispose()); }, [geometry, material]);
  useFrame(({ clock }) => { if (land.current) land.current.position.y = reduceMotion ? 0 : Math.sin(clock.elapsedTime * .32) * .045; });
  return <group ref={land}>
    <mesh geometry={geometry} material={material} position={[0, .1, 0]} receiveShadow castShadow />
    {parks.map((block) => <ParkBlock key={block.index} block={block} blockSize={world.blockSize} />)}
    {plaza && <TownSquare block={plaza} blockSize={world.blockSize} repositoryName={repositoryName} />}
    <RoadNetwork world={world} />
    <CityTraffic world={world} reduceMotion={reduceMotion} />
    {children}
  </group>;
}
