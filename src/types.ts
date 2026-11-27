export type RepositoryRole = 'source' | 'tests' | 'docs' | 'config' | 'other';
export type SpiritId = 'maker' | 'verifier' | 'archivist' | 'builder' | 'pathfinder';
export type AppPhase = 'title' | 'scanning' | 'building' | 'explore';
export type MapMode = 'world' | 'blueprint';

export interface RepositoryInfo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  topics: string[];
  updatedAt: string;
  createdAt?: string;
  watchers?: number;
}

export interface FileNode {
  path: string;
  size?: number;
  sha?: string;
}

export interface DirectoryNode {
  name: string;
  isRepositoryRoot?: boolean;
  fileCount: number;
  children: Array<{ name: string; fileCount: number }>;
  sampleFiles?: FileNode[];
}

export interface RoleSignal {
  fileCount: number;
  folders: string[];
}

export interface RepositoryStructure {
  directories: DirectoryNode[];
  directoryCount?: number;
  manifests: string[];
  roles: Partial<Record<RepositoryRole, RoleSignal>>;
}

export interface TopLevelEntry {
  name: string;
  type: 'folder' | 'file';
}

export interface RepositoryData {
  repository: RepositoryInfo;
  files: FileNode[];
  fileCount: number;
  rootFileCount?: number;
  treeTruncated: boolean;
  structure: RepositoryStructure;
  topLevel: TopLevelEntry[];
  languages: Record<string, number>;
  readme: string;
}

export interface SpiritProfile {
  id: SpiritId;
  role: RepositoryRole;
  name: string;
  title: string;
  color: string;
  greeting: string;
  manner: string;
  questions: string[];
  symbol: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  headline?: string;
  points?: string[];
  nextStep?: string;
  evidence?: string[];
}

export interface DistrictLayout {
  directory: DirectoryNode;
  x: number;
  z: number;
  index: number;
  seed: number;
  blocks: CityBlock[];
  landmark: WorldPoint;
  spirit: WorldPoint;
}

export type CityBlockKind = 'district' | 'park' | 'plaza';

export interface CityBlock {
  kind: CityBlockKind;
  row: number;
  column: number;
  x: number;
  z: number;
  index: number;
  seed: number;
  districtName?: string;
}

export interface WorldPoint {
  x: number;
  z: number;
}

export interface WorldRoad {
  start: WorldPoint;
  end: WorldPoint;
  width?: number;
  kind?: 'avenue' | 'street';
}

export interface WorldLayout {
  seed: number;
  outline: WorldPoint[];
  width: number;
  depth: number;
  rows: number;
  columns: number;
  blockSize: number;
  pitch: number;
  blocks: CityBlock[];
  districts: DistrictLayout[];
  avenues: WorldRoad[];
  crossings: WorldPoint[];
  plaza: WorldPoint;
}

export interface BuildingLayout {
  file: FileNode;
  index: number;
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  rotation: number;
  kind: 'note' | 'plan' | 'media' | 'test' | 'code';
  variant: number;
  asset: string;
}

export interface ChildBuildingLayout {
  name: string;
  fileCount: number;
  index: number;
  x: number;
  z: number;
  rotation: number;
  asset: string;
}
