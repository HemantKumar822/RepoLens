import type { CSSProperties } from 'react';
import type { RepositoryData } from '../types';
import { directoriesFor, formatCount } from '../lib/github';
import { roleForFolder } from '../data/spirits';
import { layoutWorld } from '../world/layout';

export function BlueprintMap({ data, selectedFolder, onSelect, onClose, fallback = false }: {
  data: RepositoryData; selectedFolder: string | null; onSelect: (folder: string) => void; onClose: () => void; fallback?: boolean;
}) {
  const directories = directoriesFor(data).slice(0, 18);
  const world = layoutWorld(directories, data.repository.fullName, data.fileCount);
  const directoryByName = new Map(directories.map((directory) => [directory.name, directory]));
  const primaryBlockByName = new Map(world.districts.map((district) => [district.directory.name, district.blocks[0]?.index]));

  return <main className="blueprint-screen">
    <header className="blueprint-topbar"><div><span>REPOLENS / FIELD MAP</span><h1>{data.repository.fullName}</h1></div><button className="hud-button" onClick={onClose}>{fallback ? 'New world' : 'Return to world'} <span aria-hidden="true">↗</span></button></header>
    <div className="blueprint-intro"><span>THE FOLDER LANDSCAPE</span><p>Pick a neighborhood to inspect its actual file paths.</p></div>
    <div className="blueprint-layout">
      <div className="blueprint-plot">
        <div className="plot-sun" aria-hidden="true" />
        <div className="city-map-grid" style={{ '--city-columns': world.columns, '--city-rows': world.rows } as CSSProperties}>
          {world.blocks.map((block) => {
            if (block.kind === 'plaza') return <div key={block.index} className="city-map-cell city-map-plaza">
              <span>COMMONS</span><strong>{formatCount(data.fileCount)}</strong><small>files</small>
            </div>;
            if (block.kind === 'park') return <div key={block.index} className="city-map-cell city-map-park" aria-label="City park">
              <i aria-hidden="true" /><i aria-hidden="true" /><span>PARK</span>
            </div>;
            const directory = directoryByName.get(block.districtName || '');
            if (!directory) return null;
            const role = roleForFolder(directory.name, data.structure);
            const primary = primaryBlockByName.get(directory.name) === block.index;
            const active = selectedFolder === directory.name;
            return <button key={block.index} className={`city-map-cell blueprint-district blueprint-${role}${primary ? '' : ' city-map-expansion'}${active ? ' is-active' : ''}`} onClick={() => onSelect(directory.name)} aria-label={`Explore ${directory.name}, ${formatCount(directory.fileCount)} files`}>
              <i aria-hidden="true" /><span>{primary ? directory.name : 'More lots'}</span><small>{primary ? `${formatCount(directory.fileCount)} files` : directory.name}</small>
            </button>;
          })}
        </div>
        <div className="plot-key"><span><i /> repo district</span><span><b /> park</span><span><em /> commons</span></div>
      </div>
      <aside className="blueprint-side-note"><span>HOW TO READ THIS MAP</span><div><i className="map-key-island" /><p>Each colored block is a real top-level folder. Large folders can claim adjoining blocks.</p></div><div><i className="map-key-size" /><p>Districts share the same planned street grid as the 3D city. Color shows the folder’s likely role.</p></div><small>File counts are full GitHub totals. Buildings represent a capped sample of clickable paths.</small></aside>
    </div>
  </main>;
}
