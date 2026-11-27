import type {
  BuildingLayout,
  CityBlock,
  ChildBuildingLayout,
  DirectoryNode,
  DistrictLayout,
  FileNode,
  RepositoryRole,
  WorldLayout,
  WorldPoint,
  WorldRoad,
} from '../types';

const DISTRICT_LIMIT = 18;
const BUILDING_LIMIT = 16;
const BLOCK_SIZE = 8.2;
const ROAD_WIDTH = 1.16;
const BLOCK_PITCH = BLOCK_SIZE + ROAD_WIDTH;
const LOT_COLUMNS = 5;
const LOT_ROWS = 5;
const LOT_STEP = 1.42;
const CHILD_LOTS = [
  { row: 0, column: 0 }, { row: 0, column: 4 },
  { row: 4, column: 0 }, { row: 4, column: 4 },
];

interface GridCell {
  row: number;
  column: number;
  x: number;
  z: number;
  distanceFromCenter: number;
  tieBreak: number;
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function randomFrom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makeOutline(halfWidth: number, halfDepth: number, seed: number) {
  const random = randomFrom(seed ^ 0x91e10da5);
  const phaseA = random() * Math.PI * 2;
  const phaseB = random() * Math.PI * 2;
  const samples = 48;
  const outline = Array.from({ length: samples }, (_, index) => {
    const angle = index / samples * Math.PI * 2;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const corneredX = Math.sign(cosine) * Math.pow(Math.abs(cosine), .78);
    const corneredZ = Math.sign(sine) * Math.pow(Math.abs(sine), .78);
    const coast = 1
      + Math.sin(angle * 3 + phaseA) * .024
      + Math.cos(angle * 5 + phaseB) * .014
      + Math.sin(angle * 7 + phaseA * .6) * .007;
    return { x: corneredX * halfWidth * coast, z: corneredZ * halfDepth * coast };
  });
  return { outline, width: halfWidth * 2, depth: halfDepth * 2 };
}

function blockPoint(row: number, column: number, rows: number, columns: number): WorldPoint {
  return {
    x: (column - (columns - 1) / 2) * BLOCK_PITCH,
    z: (row - (rows - 1) / 2) * BLOCK_PITCH,
  };
}

function buildBlocks(directories: DirectoryNode[], identity: string, rows: number, columns: number) {
  const centerRow = Math.floor(rows / 2);
  const centerColumn = Math.floor(columns / 2);
  const plazaKey = `${centerRow}:${centerColumn}`;
  const cells: GridCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (`${row}:${column}` === plazaKey) continue;
      const point = blockPoint(row, column, rows, columns);
      const cellHash = hash(`${identity}/block/${row}/${column}`);
      cells.push({
        row,
        column,
        ...point,
        distanceFromCenter: Math.abs(row - centerRow) + Math.abs(column - centerColumn),
        tieBreak: randomFrom(cellHash)(),
      });
    }
  }

  const ranked = directories.slice().sort((a, b) => b.fileCount - a.fileCount || a.name.localeCompare(b.name));
  const medianCount = ranked.length ? ranked[Math.floor(ranked.length / 2)].fileCount : 0;
  const growthLimit = Math.min(3, Math.floor(ranked.length / 6));
  const expandedDirectories = ranked
    .filter((directory) => directory.fileCount > 0 && directory.fileCount >= Math.max(2, medianCount * 2))
    .slice(0, growthLimit);

  const available = cells.slice().sort((a, b) => a.distanceFromCenter - b.distanceFromCenter || a.tieBreak - b.tieBreak);
  const owned = new Map<string, GridCell[]>();
  const assigned = new Map<string, DirectoryNode>();

  const takeNearest = (candidates: GridCell[], score: (cell: GridCell) => number) => {
    if (!candidates.length) return undefined;
    const candidate = candidates.slice().sort((a, b) => score(a) - score(b) || a.tieBreak - b.tieBreak)[0];
    const index = available.findIndex((cell) => cell.row === candidate.row && cell.column === candidate.column);
    if (index >= 0) available.splice(index, 1);
    return candidate;
  };

  const directoriesByMass = ranked.slice();
  for (const directory of directoriesByMass) {
    const cell = takeNearest(available, (candidate) => candidate.distanceFromCenter);
    if (!cell) break;
    assigned.set(`${cell.row}:${cell.column}`, directory);
    owned.set(directory.name, [...(owned.get(directory.name) || []), cell]);
  }

  for (const directory of expandedDirectories) {
    const current = owned.get(directory.name) || [];
    const frontier = available.filter((cell) => current.some((block) =>
      Math.abs(block.row - cell.row) + Math.abs(block.column - cell.column) === 1,
    ));
    const next = takeNearest(frontier.length ? frontier : available, (cell) =>
      Math.min(...current.map((block) => Math.abs(block.row - cell.row) + Math.abs(block.column - cell.column))),
    );
    if (!next) continue;
    assigned.set(`${next.row}:${next.column}`, directory);
    owned.set(directory.name, [...current, next]);
  }

  const blocks: CityBlock[] = [];
  const directoryIndices = new Map(directories.map((directory, index) => [directory.name, index]));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const point = blockPoint(row, column, rows, columns);
      const cellKey = `${row}:${column}`;
      const directory = assigned.get(cellKey);
      const isPlaza = cellKey === plazaKey;
      blocks.push({
        kind: isPlaza ? 'plaza' : directory ? 'district' : 'park',
        row,
        column,
        ...point,
        index: blocks.length,
        seed: hash(`${identity}/cell/${row}/${column}`),
        districtName: directory?.name,
      });
      if (directory) {
        const existing = owned.get(directory.name) || [];
        const cell = cells.find((candidate) => candidate.row === row && candidate.column === column);
        if (cell && !existing.some((candidate) => candidate.row === row && candidate.column === column)) {
          owned.set(directory.name, [...existing, cell]);
        }
      }
    }
  }

  return { blocks, owned, directoryIndices };
}

function makeRoads(rows: number, columns: number, plaza: WorldPoint): WorldRoad[] {
  const roads: WorldRoad[] = [];
  const halfWidth = columns * BLOCK_PITCH / 2;
  const halfDepth = rows * BLOCK_PITCH / 2;
  for (let row = 0; row <= rows; row += 1) {
    const z = (row - rows / 2) * BLOCK_PITCH;
    const central = Math.abs(z - (plaza.z - BLOCK_PITCH / 2)) < .01;
    roads.push({
      start: { x: -halfWidth, z },
      end: { x: halfWidth, z },
      width: central ? 1.42 : ROAD_WIDTH,
      kind: central ? 'avenue' : 'street',
    });
  }
  for (let column = 0; column <= columns; column += 1) {
    const x = (column - columns / 2) * BLOCK_PITCH;
    const central = Math.abs(x - (plaza.x - BLOCK_PITCH / 2)) < .01;
    roads.push({
      start: { x, z: -halfDepth },
      end: { x, z: halfDepth },
      width: central ? 1.42 : ROAD_WIDTH,
      kind: central ? 'avenue' : 'street',
    });
  }
  return roads;
}

function makeCrossings(rows: number, columns: number): WorldPoint[] {
  const crossings: WorldPoint[] = [];
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      crossings.push({
        x: (column - columns / 2) * BLOCK_PITCH,
        z: (row - rows / 2) * BLOCK_PITCH,
      });
    }
  }
  return crossings;
}

export function layoutWorld(directories: DirectoryNode[], repositoryIdentity: string, totalFiles = 0): WorldLayout {
  const visible = directories.slice(0, DISTRICT_LIMIT);
  const seed = hash(repositoryIdentity || 'repolens-world');
  const ranked = visible.slice().sort((a, b) => b.fileCount - a.fileCount || a.name.localeCompare(b.name));
  const medianCount = ranked.length ? ranked[Math.floor(ranked.length / 2)].fileCount : 0;
  const extraBlocks = Math.min(3, Math.floor(ranked.length / 6), ranked.filter((directory) =>
    directory.fileCount > 0 && directory.fileCount >= Math.max(2, medianCount * 2),
  ).length);
  const minimumCells = Math.max(9, visible.length + extraBlocks + 4);
  const columns = Math.max(3, Math.ceil(Math.sqrt(minimumCells)));
  const rows = Math.max(3, Math.ceil(minimumCells / columns));
  const plaza = blockPoint(Math.floor(rows / 2), Math.floor(columns / 2), rows, columns);
  const { outline, width, depth } = makeOutline(
    columns * BLOCK_PITCH / 2 + 2.8,
    rows * BLOCK_PITCH / 2 + 2.8,
    seed,
  );
  const { blocks, owned, directoryIndices } = buildBlocks(visible, repositoryIdentity, rows, columns);
  const districts: DistrictLayout[] = visible.map((directory) => {
    const directoryBlocks = (owned.get(directory.name) || [])
      .map((cell) => blocks.find((block) => block.row === cell.row && block.column === cell.column))
      .filter((block): block is CityBlock => Boolean(block))
      .sort((a, b) =>
      Math.hypot(a.x - plaza.x, a.z - plaza.z) - Math.hypot(b.x - plaza.x, b.z - plaza.z),
    );
    const primary = directoryBlocks[0];
    const x = directoryBlocks.reduce((sum, block) => sum + block.x, 0) / Math.max(1, directoryBlocks.length);
    const z = directoryBlocks.reduce((sum, block) => sum + block.z, 0) / Math.max(1, directoryBlocks.length);
    return {
      directory,
      index: directoryIndices.get(directory.name) ?? 0,
      x,
      z,
      seed: hash(`${repositoryIdentity}/${directory.name}`),
      blocks: directoryBlocks,
      landmark: primary ? { x: primary.x, z: primary.z - 2.84 } : { x, z },
      spirit: primary ? { x: primary.x, z: primary.z + 2.84 } : { x, z },
    };
  });

  const avenues = makeRoads(rows, columns, plaza);
  const crossings = makeCrossings(rows, columns);
  const fileVolume = Math.log2(Math.max(1, totalFiles) + 1);
  const scale = 1 + Math.min(.12, fileVolume * .006);
  return {
    seed,
    outline: outline.map((point) => ({ x: point.x * scale, z: point.z * scale })),
    width: width * scale,
    depth: depth * scale,
    rows,
    columns,
    blockSize: BLOCK_SIZE,
    pitch: BLOCK_PITCH,
    blocks,
    districts,
    avenues,
    crossings,
    plaza,
  };
}

function buildingKind(file: FileNode): BuildingLayout['kind'] {
  const filename = file.path.split('/').at(-1) || file.path;
  const extension = filename.split('.').at(-1)?.toLowerCase() || '';
  if (['md', 'mdx', 'rst', 'txt'].includes(extension)) return 'note';
  if (['json', 'yaml', 'yml', 'toml', 'xml', 'ini'].includes(extension)) return 'plan';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mp3', 'wav'].includes(extension)) return 'media';
  if (/test|spec/i.test(file.path)) return 'test';
  return 'code';
}

function modelFor(role: RepositoryRole, kind: BuildingLayout['kind'], variant: number) {
  if (role === 'docs') return kind === 'media' ? 'corner-shop' : 'library';
  if (role === 'tests' || kind === 'test') return variant % 3 === 0 ? 'school' : 'office';
  if (role === 'config') return ['office', 'apartments', 'market'][variant % 3];
  if (kind === 'note') return 'corner-shop';
  if (kind === 'plan') return 'office';
  if (kind === 'media') return variant % 2 ? 'restaurant' : 'market';
  if (role === 'source') return ['office', 'market', 'corner-shop', 'restaurant'][variant % 4];
  return ['townhouse', 'apartments', 'corner-shop'][variant % 3];
}

function lotRotation(x: number, z: number) {
  if (Math.abs(x) > Math.abs(z)) return x < 0 ? Math.PI / 2 : -Math.PI / 2;
  return z > 0 ? Math.PI : 0;
}

function blockLots(block: CityBlock, reserveLandmark: boolean, childCount: number) {
  const columnOrder = Array.from({ length: LOT_COLUMNS }, (_, index) => index);
  const lots: Array<{ x: number; z: number; rotation: number }> = [];
  for (let row = 0; row < LOT_ROWS; row += 1) {
    const columnsForRow = row % 2 ? columnOrder.slice().reverse() : columnOrder;
    for (const column of columnsForRow) {
      const reservedChild = CHILD_LOTS.slice(0, childCount).some((lot) => lot.row === row && lot.column === column);
      if (reserveLandmark && ((row === 0 && column === 2) || (row === LOT_ROWS - 1 && column === 2))) continue;
      if (reserveLandmark && reservedChild) continue;
      const x = (column - (LOT_COLUMNS - 1) / 2) * LOT_STEP;
      const z = (row - (LOT_ROWS - 1) / 2) * LOT_STEP;
      lots.push({ x: block.x + x, z: block.z + z, rotation: lotRotation(x, z) });
    }
  }
  return lots;
}

export function buildingPlan(files: FileNode[], district?: DistrictLayout, role: RepositoryRole = 'other'): BuildingLayout[] {
  const sample = files.slice(0, BUILDING_LIMIT);
  if (!sample.length) return [];
  const blocks = district?.blocks.filter((block) => block.kind === 'district') || [];
  const fallbackBlock: CityBlock = {
    kind: 'district', row: 0, column: 0, x: district?.x || 0, z: district?.z || 0,
    index: 0, seed: district?.seed || hash(sample.map((file) => file.path).join('|')),
  };
  const usableBlocks = blocks.length ? blocks : [fallbackBlock];
  const childCount = district?.directory.children.length || 0;
  const lotGroups = usableBlocks.map((block, blockIndex) => blockLots(block, blockIndex === 0, blockIndex === 0 ? childCount : 0));
  const candidateLots: Array<{ x: number; z: number; rotation: number }> = [];
  for (let index = 0; lotGroups.some((lots) => index < lots.length); index += 1) {
    lotGroups.forEach((lots) => { if (lots[index]) candidateLots.push(lots[index]); });
  }
  const seed = district?.seed ?? hash(sample.map((file) => file.path).join('|'));
  const random = randomFrom(seed);

  return sample.slice(0, candidateLots.length).map((file, index) => {
    const lot = candidateLots[index];
    const kind = buildingKind(file);
    const variant = hash(`${seed}/${file.path}`) % 7;
    const size = Math.max(0, file.size || 0);
    const height = .68 + Math.min(1.12, Math.log10(size + 1) * .2);
    const width = .96 + random() * .18;
    const depth = .92 + random() * .18;
    return {
      file,
      index,
      x: lot.x,
      z: lot.z,
      height,
      width,
      depth,
      rotation: lot.rotation,
      kind,
      variant,
      asset: modelFor(role, kind, variant),
    };
  });
}

export function subfolderPlan(directory: DirectoryNode, district: DistrictLayout, role: RepositoryRole): ChildBuildingLayout[] {
  const block = district.blocks[0];
  if (!block) return [];
  return directory.children.slice(0, CHILD_LOTS.length).map((child, index) => {
    const lot = CHILD_LOTS[index];
    const x = (lot.column - (LOT_COLUMNS - 1) / 2) * LOT_STEP;
    const z = (lot.row - (LOT_ROWS - 1) / 2) * LOT_STEP;
    const variant = hash(`${district.seed}/${child.name}`) % 7;
    return {
      name: child.name,
      fileCount: child.fileCount,
      index,
      x: block.x + x,
      z: block.z + z,
      rotation: lotRotation(x, z),
      asset: modelFor(role, 'code', variant),
    };
  });
}
