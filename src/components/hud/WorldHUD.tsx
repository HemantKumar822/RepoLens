import type { RepositoryData } from '../../types';
import { directoriesFor, formatCount } from '../../lib/github';

interface WorldHUDProps {
  data: RepositoryData;
  selectedFolder: string | null;
  onSelect: (folder: string) => void;
  onJournal: () => void;
  onBlueprint: () => void;
  onHome: () => void;
}

export function WorldHUD({ data, selectedFolder, onSelect, onJournal, onBlueprint, onHome }: WorldHUDProps) {
  const directories = directoriesFor(data).slice(0, 18);
  return <>
    <header className="world-topbar">
      <button className="world-brand" onClick={onHome} aria-label="Return to RepoLens home">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>REPO<span>LENS</span></span>
      </button>
      <div className="world-identity">
        <span className="world-live-dot" />
        <div><strong>{data.repository.name}</strong><small>{data.repository.fullName} · {data.repository.defaultBranch}{data.treeTruncated ? ' · tree truncated' : ''}</small></div>
      </div>
      <div className="world-tools">
        <div className="world-fact"><small>DISTRICTS</small><b>{formatCount(data.structure.directoryCount ?? data.structure.directories.length)}</b></div>
        <div className="world-fact"><small>FILES</small><b>{formatCount(data.fileCount)}</b></div>
        <button className="hud-button" onClick={onBlueprint}><span className="grid-icon" aria-hidden="true" />Map</button>
        <button className="hud-button" onClick={onJournal}><span className="journal-icon" aria-hidden="true">≡</span>Journal</button>
        <button className="hud-button new-world-button" onClick={onHome} aria-label="Analyze another repository">New world <span aria-hidden="true">↗</span></button>
      </div>
    </header>

    <div className="world-bottom-hud">
      <div className="district-caption"><span>{(data.structure.directoryCount ?? data.structure.directories.length) > directories.length ? `TOP ${directories.length} OF ${formatCount(data.structure.directoryCount ?? data.structure.directories.length)} DISTRICTS` : 'YOU ARE EXPLORING'}</span><strong>{selectedFolder || 'Choose a district'}</strong></div>
      <nav className="district-rail" aria-label="Repository districts">
        {directories.map((directory, index) => <button
          key={directory.name}
          className={`district-tab${selectedFolder === directory.name ? ' is-active' : ''}`}
          onClick={() => onSelect(directory.name)}
          title={`${directory.name}, ${directory.fileCount} files`}
        ><i className={`district-tab-mark mark-${index % 5}`} />{directory.name}<small>{formatCount(directory.fileCount)}</small></button>)}
      </nav>
      <div className="controls-hint"><span>DRAG TO TURN</span><i /> <span>SCROLL TO ZOOM</span><i /> <span>TAP A PLACE</span></div>
    </div>
  </>;
}
