import type { RepositoryData } from '../../types';
import { formatCount, timeAgo } from '../../lib/github';

export function WorldJournal({ data, onClose }: { data: RepositoryData; onClose: () => void }) {
  const languages = Object.entries(data.languages).sort((a, b) => b[1] - a[1]);
  const total = languages.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
  const segments: string[] = [];
  let start = 0;
  const colors = ['#259d91', '#f28d72', '#6d83d8', '#ebb95f', '#75af70', '#bc82bb', '#e0ad83'];
  languages.forEach(([, bytes], index) => {
    const end = start + bytes / total * 100;
    segments.push(`${colors[index % colors.length]} ${start}% ${end}%`);
    start = end;
  });
  return <div className="journal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="journal-panel" role="dialog" aria-modal="true" aria-labelledby="journal-title">
      <div className="journal-header"><div><span>FIELD NOTES / {data.repository.fullName}</span><h2 id="journal-title">A closer look.</h2></div><button className="close-control" onClick={onClose} aria-label="Close field notes">×</button></div>
      <div className="journal-summary">
        <p>{data.repository.description}</p>
        <div className="journal-stats"><div><small>FILE PATHS</small><strong>{formatCount(data.fileCount)}</strong></div><div><small>STARS</small><strong>{formatCount(data.repository.stars)}</strong></div><div><small>UPDATED</small><strong>{timeAgo(data.repository.updatedAt)}</strong></div></div>
      </div>
      <div className="journal-content">
        <section className="language-card"><div className="journal-section-title"><span>LANGUAGE MIX</span><small>BY FILE SIZE</small></div>
          <div className="language-chart-wrap"><div className="language-chart" style={{ background: `conic-gradient(${segments.join(',')})` }}><div><strong>{languages.length}</strong><small>languages</small></div></div><div className="language-legend">{languages.slice(0, 7).map(([name, bytes], index) => <div key={name}><i style={{ backgroundColor: colors[index % colors.length] }} /><span>{name}</span><small>{Math.round(bytes / total * 100)}%</small></div>)}{!languages.length && <p>No language breakdown came back from GitHub.</p>}</div></div>
        </section>
        <section className="journal-map-facts"><div className="journal-section-title"><span>WORLD NOTES</span><small>FROM THE FILE TREE</small></div>
          <div className="note-line"><b>{data.structure.directoryCount ?? data.structure.directories.length}</b><span>top-level folders found in the tree</span></div>
          <div className="note-line"><b>{data.structure.manifests.length}</b><span>project setup files detected</span></div>
          <div className="note-line"><b>{data.structure.roles.source?.fileCount || 0}</b><span>paths with common source-code extensions</span></div>
          <div className="note-line"><b>{data.structure.roles.tests?.fileCount || 0}</b><span>paths that look like tests by name</span></div>
          {data.treeTruncated && <p className="journal-caveat">GitHub marked this file tree as truncated, so totals describe the paths it returned.</p>}
        </section>
      </div>
      {data.readme && <details className="readme-details"><summary>READ THE README EXCERPT <span>↗</span></summary><pre>{data.readme.slice(0, 4800)}</pre></details>}
    </section>
  </div>;
}
