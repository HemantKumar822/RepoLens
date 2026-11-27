import type { DirectoryNode, RepositoryData } from '../../types';
import { fileKind, formatCount, githubFileUrl } from '../../lib/github';
import { roleForFolder, spiritForFolder } from '../../data/spirits';

interface Props {
  data: RepositoryData;
  directory: DirectoryNode;
  selectedFile: string | null;
  onClose: () => void;
  onTalk: () => void;
  onFile: (path: string) => void;
}

export function DistrictInspector({ data, directory, selectedFile, onClose, onTalk, onFile }: Props) {
  const role = roleForFolder(directory.name, data.structure);
  const spirit = spiritForFolder(directory.name, data.structure);
  const files = directory.sampleFiles || [];
  const visibleFiles = selectedFile && files.some((file) => file.path === selectedFile)
    ? [files.find((file) => file.path === selectedFile)!, ...files.filter((file) => file.path !== selectedFile).slice(0, 5)]
    : files.slice(0, 6);
  return <aside className="inspector-panel" aria-label={`${directory.name} district details`}>
    <div className="panel-grip" aria-hidden="true" />
    <div className="panel-heading-row">
      <div className="inspector-kicker"><span className={`role-stamp role-${role}`} /> DISTRICT / {role.toUpperCase()}</div>
      <button className="close-control" onClick={onClose} aria-label="Close district details">×</button>
    </div>
    <h2>{directory.name}<span className="district-period">.</span></h2>
    <p className="inspector-description">{directory.children.length ? 'Side streets lead into smaller folders in this district.' : 'A neighborhood formed from the folder paths in this repository.'}</p>
    <div className="district-meter">
      <div><span>FOLDER FOOTPRINT</span><strong>{directory.fileCount.toLocaleString()}<small> paths</small></strong></div>
      <div className="meter-bars" aria-label={`Relative folder footprint for ${directory.fileCount} paths`}>
        {Array.from({ length: 12 }, (_, index) => <i key={index} className={index < Math.max(1, Math.ceil(Math.log2(directory.fileCount + 1))) ? `meter-${role}` : ''} />)}
      </div>
      <small className="sample-disclosure">A small selection of real paths appears below. More filled bars mean more paths in this folder.</small>
    </div>
    {directory.children.length > 0 && <div className="subfolder-list"><div><span>SIDE STREETS</span><small>SUBFOLDERS</small></div><nav aria-label={`${directory.name} subfolders`}>
      {directory.children.map((child) => <a key={child.name} href={githubFileUrl(data.repository.url, data.repository.defaultBranch, `${directory.name}/${child.name}`, 'tree')} target="_blank" rel="noreferrer"><span>{child.name}</span><small>{formatCount(child.fileCount)}</small></a>)}
    </nav></div>}
    <div className="district-actions">
      <button className="talk-button" onClick={onTalk}><span className={`spirit-token spirit-${role}`} aria-hidden="true">{spirit.symbol}</span><span>Talk with {spirit.name}<small>{spirit.title}</small></span><b aria-hidden="true">↗</b></button>
    </div>
    <div className="file-list-heading"><span>PATHS TO DISCOVER</span><small>{visibleFiles.length} shown</small></div>
    <div className="file-list">
      {visibleFiles.map((file) => <div className={`file-row${selectedFile === file.path ? ' is-picked' : ''}`} key={file.path}>
        <button className={`file-kind kind-${fileKind(file.path)}`} onClick={() => onFile(file.path)} aria-label={`Select ${file.path}`}><span /></button>
        <button className="file-path-button" onClick={() => onFile(file.path)} title={file.path}>
          <strong>{file.path.split('/').at(-1)}</strong><small>{file.path}</small>
        </button>
        <a className="file-open" href={githubFileUrl(data.repository.url, data.repository.defaultBranch, file.path)} target="_blank" rel="noreferrer" aria-label={`Open ${file.path} on GitHub`}>↗</a>
      </div>)}
      {!files.length && <p className="empty-files">The returned tree has no sample files in this district yet. You can still follow its folder on GitHub.</p>}
    </div>
    <div className="panel-footer">
      <span>{formatCount(directory.fileCount)} paths in this folder</span>
      <a href={directory.isRepositoryRoot ? data.repository.url : githubFileUrl(data.repository.url, data.repository.defaultBranch, directory.name, 'tree')} target="_blank" rel="noreferrer">View folder on GitHub ↗</a>
    </div>
  </aside>;
}
