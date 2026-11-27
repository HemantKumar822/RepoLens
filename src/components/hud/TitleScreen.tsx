import { FormEvent, useState } from 'react';

const sampleWorlds = [
  { name: 'Superpowers', owner: 'obra', url: 'https://github.com/obra/superpowers', hue: 'violet' },
  { name: 'FastAPI', owner: 'fastapi', url: 'https://github.com/fastapi/fastapi', hue: 'teal' },
];

interface TitleScreenProps {
  error: string;
  onAnalyze: (url: string) => void;
}

export function TitleScreen({ error, onAnalyze }: TitleScreenProps) {
  const [url, setUrl] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (url.trim()) onAnalyze(url.trim());
  };

  return (
    <main className="title-screen" id="top" aria-labelledby="title-heading">
      <header className="title-topbar">
        <a className="wordmark" href="#top" aria-label="RepoLens home">
          <span className="wordmark-glyph" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>REPO<span className="wordmark-accent">LENS</span></span>
        </a>
        <a className="project-link" href="https://github.com/HemantKumar822/RepoLens" target="_blank" rel="noreferrer">OPEN SOURCE ↗</a>
      </header>

      <section className="title-copy">
        <p className="eyebrow-line"><span className="signal-dot" /> A LIVING MAP OF CODE</p>
        <h1 id="title-heading">Step inside<br />a <span>codeworld.</span></h1>
        <p className="title-description">Every repo has its own little civilization. Meet its makers, find the paths, and see how the pieces fit together.</p>

        <form className="world-entry" onSubmit={submit}>
          <label htmlFor="repo-address">GITHUB WORLD ADDRESS</label>
          <div className="entry-row">
            <span className="entry-caret" aria-hidden="true">&gt;</span>
            <input
              id="repo-address"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
            <button type="submit" disabled={!url.trim()}>
              <span>BUILD WORLD</span><span aria-hidden="true">▶</span>
            </button>
          </div>
          {error && <p className="entry-error" role="alert">{error}</p>}
        </form>

        <div className="sample-worlds">
          <span className="sample-label">OR VISIT A SAMPLE WORLD</span>
          <div className="sample-actions">
            {sampleWorlds.map((world) => (
              <button className={`sample-world sample-${world.hue}`} type="button" key={world.name} onClick={() => onAnalyze(world.url)}>
                <span className="sample-sigil" aria-hidden="true">✦</span>
                <span><strong>{world.name}</strong><small>{world.owner} / {world.name.toLowerCase()}</small></span>
                <span className="sample-enter" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </div>

        <div className="world-language" aria-label="How the world is built">
          <span>FOLDERS <b>→</b> DISTRICTS</span><span>FILES <b>→</b> BUILDINGS</span><span>SPIRITS <b>→</b> GUIDES</span>
        </div>
      </section>

      <aside className="title-world-hint"><span className="pixel-star" aria-hidden="true">✦</span><span>PUBLIC REPO IN. LITTLE CODE WORLD OUT. MADE FOR CURIOUS MINDS.</span></aside>
      <div className="title-world-mark" aria-hidden="true"><span>NEW</span><strong>WORLD</strong><i>+</i></div>
    </main>
  );
}
