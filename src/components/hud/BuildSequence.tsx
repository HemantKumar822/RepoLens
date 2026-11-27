import { useEffect, useState } from 'react';
import type { AppPhase, RepositoryData } from '../../types';

const scanLines = [
  'Calling the public GitHub map…',
  'Reading folders and file names…',
  'Finding the paths that shape this place…',
];

export function BuildSequence({ phase, data }: { phase: AppPhase; data: RepositoryData | null }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (phase !== 'scanning') { setLine(0); return; }
    const timer = window.setInterval(() => setLine((value) => (value + 1) % scanLines.length), 1450);
    return () => window.clearInterval(timer);
  }, [phase]);

  if (phase !== 'scanning' && phase !== 'building') return null;
  const building = phase === 'building';
  return <div className={`build-sequence${building ? ' is-building' : ''}`} role="status" aria-live="polite">
    <div className="build-emblem" aria-hidden="true"><span /><span /><span /><span /><i /></div>
    <p className="build-kicker">{building ? 'A NEW PLACE IS TAKING SHAPE' : 'REPOLENS IS EXPLORING'}</p>
    <h1>{building ? `Growing ${data?.repository.name || 'your world'}` : 'Finding the shape of this repo'}</h1>
    <p className="build-status">{building ? 'Folders become districts. File paths become little places.' : scanLines[line]}</p>
    {building && <div className="build-tally"><span>{data?.structure.directoryCount ?? data?.structure.directories.length ?? 0} districts</span><i /><span>{data?.fileCount.toLocaleString() ?? '…'} paths</span></div>}
    <div className="build-track" aria-hidden="true"><span /></div>
    <p className="build-footnote">{building && data?.treeTruncated ? 'GitHub shortened this file tree; the world shows the paths it returned.' : building ? 'The map is built from the repository tree.' : 'Large repos can take a few seconds to answer.'}</p>
  </div>;
}
