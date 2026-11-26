const form = document.querySelector('#repo-form');
const input = document.querySelector('#repo-url');
const button = document.querySelector('#analyze-button');
const message = document.querySelector('#form-message');
const results = document.querySelector('#results');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatNumber(value = 0) {
  return new Intl.NumberFormat('en', { notation: value > 999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

function timeAgo(value) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function githubFileUrl(repo, path, kind = 'blob') {
  const ownerAndRepo = repo.fullName.split('/').map(encodeURIComponent).join('/');
  const branch = encodeURIComponent(repo.defaultBranch || 'main');
  const filePath = path.split('/').map(encodeURIComponent).join('/');
  return `https://github.com/${ownerAndRepo}/${kind}/${branch}/${filePath}`;
}

const chartColors = ['#2d78a8', '#e27656', '#d0a13a', '#7a69aa', '#4e8b72', '#c77291'];

function renderRepoGraph(repo, structure) {
  const folders = (structure?.directories || []).slice(0, 5);
  if (!folders.length) return '<p class="readme-empty">No folder structure to map yet.</p>';
  const nodeHeight = 48;
  const gap = 12;
  const height = Math.max(175, folders.length * (nodeHeight + gap) + 12);
  const rootCenter = height / 2;
  const startY = (height - (folders.length * nodeHeight + (folders.length - 1) * gap)) / 2;
  const links = folders.map((folder, index) => {
    const y = startY + index * (nodeHeight + gap);
    const center = y + nodeHeight / 2;
    const href = githubFileUrl(repo, folder.name, 'tree');
    const childSummary = (folder.children || []).slice(0, 2).map((child) => child.name).join(' · ');
    const detail = `${formatNumber(folder.fileCount)} files${childSummary ? ` · ${childSummary}` : ''}`;
    return `<path class="graph-link" d="M218 ${rootCenter} C286 ${rootCenter}, 286 ${center}, 356 ${center}"/><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(folder.name)} folder, ${formatNumber(folder.fileCount)} files, on GitHub"><rect class="graph-child graph-color-${index % chartColors.length}" x="366" y="${y}" width="226" height="${nodeHeight}" rx="6"/><circle class="graph-dot graph-dot-${index % chartColors.length}" cx="380" cy="${center - 7}" r="2.8"/><text class="graph-label" x="393" y="${center - 3}">${escapeHtml(folder.name.length > 25 ? `${folder.name.slice(0, 22)}…` : folder.name)}</text><text class="graph-sub" x="393" y="${center + 12}">${escapeHtml(detail.length > 31 ? `${detail.slice(0, 28)}…` : detail)}</text><text class="graph-sub graph-open" x="578" y="${center - 3}" text-anchor="end">OPEN ↗</text></a>`;
  }).join('');
  const name = escapeHtml(repo.name.length > 22 ? `${repo.name.slice(0, 19)}…` : repo.name);
  return `<svg class="repo-graph" viewBox="0 0 610 ${height}" role="group" aria-label="Repository map: ${escapeHtml(repo.name)} connected to ${folders.map((folder) => `${escapeHtml(folder.name)}, ${formatNumber(folder.fileCount)} files`).join('; ')}">
    ${links}
    <rect class="graph-root" x="25" y="${rootCenter - 27}" width="193" height="54" rx="7"/>
    <text class="graph-sub" x="41" y="${rootCenter - 7}">REPOSITORY ROOT</text>
    <text class="graph-label" x="41" y="${rootCenter + 12}">${name}</text>
    <circle class="graph-dot" cx="199" cy="${rootCenter - 11}" r="3"/>
  </svg>`;
}

function renderLanguages(languages) {
  const allEntries = Object.entries(languages || {}).sort((a, b) => b[1] - a[1]);
  const total = allEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
  const entries = allEntries.slice(0, 6);
  if (!total) return '<p class="readme-empty">GitHub did not detect a language breakdown.</p>';
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = entries.map(([name, bytes], index) => {
    const exactPercent = (bytes / total) * 100;
    const percent = exactPercent < 1 ? '<1%' : `${Math.round(exactPercent)}%`;
    const arc = `<circle cx="64" cy="64" r="${radius}" fill="none" stroke="${chartColors[index % chartColors.length]}" stroke-width="13" stroke-dasharray="${(exactPercent / 100) * circumference} ${circumference}" stroke-dashoffset="${-offset}"/>`;
    offset += (exactPercent / 100) * circumference;
    return { name, percent, arc, color: chartColors[index % chartColors.length] };
  });
  const legend = arcs.map((item) => `<li><span class="language-swatch" style="--swatch:${item.color}"></span><span class="language-name">${escapeHtml(item.name)}</span><span class="language-percent">${item.percent}</span></li>`).join('');
  return `<div class="language-chart"><svg class="language-donut" viewBox="0 0 128 128" role="img" aria-label="Language composition by code size: ${arcs.map((item) => `${escapeHtml(item.name)} ${item.percent}`).join(', ')}"><circle class="donut-track" cx="64" cy="64" r="${radius}"/><g transform="rotate(-90 64 64)">${arcs.map((item) => item.arc).join('')}</g><text class="donut-number" x="64" y="61">${allEntries.length}</text><text class="donut-caption" x="64" y="76">LANGUAGES</text></svg><ul class="language-legend">${legend}</ul></div>`;
}

function renderDirectoryChart(directories, repo) {
  if (!directories?.length) return '<p class="readme-empty">No root folders were found.</p>';
  const maxCount = directories[0].fileCount || 1;
  return directories.slice(0, 6).map((directory, index) => {
    const width = Math.max(1.5, (directory.fileCount / maxCount) * 100);
    return `<a class="directory-row" href="${escapeHtml(githubFileUrl(repo, directory.name, 'tree'))}" target="_blank" rel="noreferrer"><span class="directory-name">${escapeHtml(directory.name)}/</span><span class="directory-track" role="img" aria-label="${formatNumber(directory.fileCount)} files"><span style="width:${width}%;--bar:${chartColors[index % chartColors.length]}"></span></span><span class="directory-count">${formatNumber(directory.fileCount)}</span></a>`;
  }).join('');
}

function renderStructureAnalysis(structure) {
  const roles = structure?.roles || {};
  const signals = [
    { key: 'source', title: 'Code', note: 'source files', color: 'blue' },
    { key: 'tests', title: 'Tests', note: 'test files', color: 'coral' },
    { key: 'docs', title: 'Docs', note: 'documentation files', color: 'gold' },
    { key: 'config', title: 'Build', note: 'config signals', color: 'violet' },
  ];
  const cards = signals.map((signal) => {
    const role = roles[signal.key] || { fileCount: 0, folders: [] };
    const detail = role.folders.length ? role.folders.slice(0, 3).map((folder) => `${folder}/`).join(' · ') : signal.key === 'config' ? (structure?.manifests?.slice(0, 2).join(' · ') || 'No manifest detected') : 'No clear folder signal';
    return `<article class="signal-card signal-${signal.color}"><span class="signal-label">${signal.title}</span><strong>${formatNumber(role.fileCount)}</strong><span class="signal-note">${signal.note}</span><small>${escapeHtml(detail)}</small></article>`;
  }).join('');
  const manifests = (structure?.manifests || []).slice(0, 6).map((item) => `<span class="manifest-chip">${escapeHtml(item)}</span>`).join('');
  const largest = structure?.directories?.[0];
  const summary = largest
    ? `<p class="shape-summary">The largest area is <strong>${escapeHtml(largest.name)}/</strong> with ${formatNumber(largest.fileCount)} files. Counts come from GitHub’s file tree; they show structure, not code quality.</p>`
    : '<p class="shape-summary">This repository has no nested folders yet; its files are organized at the root.</p>';
  return `${summary}<div class="signal-grid">${cards}</div>${manifests ? `<div class="manifest-list"><span class="mini-label">PROJECT MANIFESTS</span>${manifests}</div>` : ''}`;
}

function readmeExcerpt(markdown = '') {
  const lines = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .split(/\r?\n/);
  const paragraph = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (paragraph.length) break;
      continue;
    }
    if (/^#{1,6}\s/.test(line) || /^\s*[-*_]{3,}\s*$/.test(line) || /^\s*\|/.test(line) || /^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line) || /^\s*!?\[[^\]]*\]\(/.test(line)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(line);
  }
  const text = paragraph.join(' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return text.length > 390 ? `${text.slice(0, 387).trimEnd()}…` : text;
}

function recommendedFiles(files) {
  const paths = files.map((file) => file.path);
  const preferred = [
    ['README.md', 'Project overview'],
    ['AGENTS.md', 'Repository guidance'],
    ['CONTRIBUTING.md', 'Contribution guide'],
    ['package.json', 'Scripts and dependencies'],
    ['pyproject.toml', 'Python project setup'],
    ['Cargo.toml', 'Rust project setup'],
    ['go.mod', 'Go module setup'],
    ['requirements.txt', 'Python dependencies'],
  ];
  const matches = preferred
    .map(([path, label]) => ({ path: paths.find((candidate) => candidate.toLowerCase() === path.toLowerCase()), label }))
    .filter((item) => item.path);
  for (const file of paths) {
    if (matches.length >= 4) break;
    if (/^(src|app|lib|cmd)\/[^/]+\.(ts|tsx|js|jsx|py|go|rs)$/.test(file) && !matches.some((item) => item.path === file)) {
      matches.push({ path: file, label: 'Application entry point' });
    }
  }
  if (!matches.length) return paths.slice(0, 3).map((path) => ({ path, label: 'First files to inspect' }));
  return matches.slice(0, 4);
}

function renderMarkdown(markdown) {
  const safe = escapeHtml(markdown);
  const inline = (line) => line
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const lines = safe.split(/\r?\n/);
  const output = [];
  let inList = false;
  for (const line of lines) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (!bullet && inList) { output.push('</ul>'); inList = false; }
    if (heading) output.push(`<h${Math.min(4, heading[1].length + 1)}>${inline(heading[2])}</h${Math.min(4, heading[1].length + 1)}>`);
    else if (bullet) {
      if (!inList) { output.push('<ul>'); inList = true; }
      output.push(`<li>${inline(bullet[1])}</li>`);
    } else if (line.trim()) output.push(`<p>${inline(line)}</p>`);
  }
  if (inList) output.push('</ul>');
  return output.join('');
}

function renderResults(data, analysis, aiState = 'off', aiError = '') {
  if (threeCleanup) { threeCleanup(); threeCleanup = null; }
  currentRepoData = data;
  selectedRepoFolder = data.structure?.directories?.[0]?.name || '';
  const repo = data.repository;
  const structure = data.structure || { directories: [], manifests: [], roles: {} };
  const tags = (repo.topics || []).slice(0, 5).map((topic) => `<span class="repo-tag">${escapeHtml(topic)}</span>`).join('');
  const recommended = recommendedFiles(data.files).map((item) => `<li><a href="${escapeHtml(githubFileUrl(repo, item.path))}" target="_blank" rel="noreferrer"><span>${escapeHtml(item.path)}</span><span>${escapeHtml(item.label)} ↗</span></a></li>`).join('');
  const excerpt = readmeExcerpt(data.readme);
  const readmeContent = excerpt
    ? `<div class="readme-copy"><p>${escapeHtml(excerpt)}</p></div>`
    : '<div class="readme-copy"><p class="readme-empty">There is no README yet. Start with the project manifest or entry point below.</p></div>';
  const aiContent = analysis
    ? `<div class="ai-copy">${renderMarkdown(analysis)}</div>`
    : aiState === 'loading'
      ? '<div class="ai-progress"><span class="ai-pulse" aria-hidden="true"></span><p>Reading the README and file map for a grounded tour…</p></div>'
      : aiState === 'error'
        ? `<p class="ai-placeholder"><strong>Repo map is ready.</strong><br>AI notes could not be created: ${escapeHtml(aiError)}</p>`
        : '<p class="ai-placeholder"><strong>Your map is ready.</strong><br>Ask a question when you want an AI explanation. Configure <code>GROQ_API_KEY</code> on the server to enable the guide.</p>';
  const aiLabel = analysis ? 'GROUNDED IN THIS TREE' : aiState === 'loading' ? 'READING FILES' : aiState === 'error' ? 'UNAVAILABLE' : 'OPTIONAL';
  const rootFiles = data.topLevel.filter((entry) => entry.type === 'file').slice(0, 6).map((entry) => `<div class="root-file"><span class="file-glyph" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4 1.8h5l3 3V14H4zM9 2v3h3M6 8h4M6 10.5h4"/></svg></span><span>${escapeHtml(entry.name)}</span></div>`).join('');
  results.innerHTML = `
    <div class="result-head">
      <div class="result-title-block"><p class="result-kicker">FIELD NOTES / ${escapeHtml(repo.defaultBranch || 'empty repository')}</p><h2>${escapeHtml(repo.fullName)}</h2><p class="result-description">${escapeHtml(repo.description)}</p>${tags ? `<div class="repo-tags">${tags}</div>` : ''}</div>
      <div class="result-actions"><button id="new-repo-button" class="reset-button" type="button"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M14.5 9a5.5 5.5 0 1 1-1.6-3.9M14.5 3.5v3.7h-3.7"/></svg>New map</button><a class="result-link" href="${escapeHtml(repo.url)}" target="_blank" rel="noreferrer">View source <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M5 13 13 5M6 5h7v7"/></svg></a></div>
    </div>
    <div class="stats-grid" aria-label="Repository statistics">
      <div class="stat"><span class="stat-label">Stars</span><span class="stat-value">${formatNumber(repo.stars)}</span></div>
      <div class="stat"><span class="stat-label">Forks</span><span class="stat-value">${formatNumber(repo.forks)}</span></div>
      <div class="stat"><span class="stat-label">Open issues</span><span class="stat-value">${formatNumber(repo.openIssues)}</span></div>
      <div class="stat"><span class="stat-label">Files mapped</span><span class="stat-value">${formatNumber(data.fileCount)}</span></div>
    </div>
    <div class="result-layout">
      <div class="result-column">
        <section class="info-card map-card"><div class="card-head"><h3>Explore the map</h3><div class="map-modes" role="group" aria-label="Map view"><button type="button" class="map-mode active" data-map-mode="2d" aria-pressed="true">2D map</button><button type="button" class="map-mode" data-map-mode="3d" aria-pressed="false">3D explore</button></div></div><p class="map-hint">Pick a district to inspect it, or switch to 3D and explore the landscape.</p><div class="map-challenge"><span>FIELD CHALLENGE</span><p id="challenge-text">Find where this project keeps its tests or docs.</p><button id="challenge-start" type="button">Start challenge</button></div><div class="map-scene map-scene-2d"><div class="map-controls"><div class="map-filters" role="group" aria-label="Filter folders"><button type="button" class="map-filter active" data-filter="all">All</button><button type="button" class="map-filter" data-filter="source">Code</button><button type="button" class="map-filter" data-filter="tests">Tests</button><button type="button" class="map-filter" data-filter="docs">Docs</button></div><div class="map-zooms" role="group" aria-label="Map zoom"><button type="button" data-zoom="out" aria-label="Zoom out">−</button><button type="button" data-zoom="in" aria-label="Zoom in">+</button></div></div><div class="graph-wrap">${renderRepoGraph(repo, structure)}</div><div class="district-list" aria-label="Choose a folder">${structure.directories.slice(0, 12).map((folder, index) => `<button type="button" class="district-chip${index===0?' selected':''}" data-folder="${escapeHtml(folder.name)}"><span class="district-dot dot-${index%6}"></span>${escapeHtml(folder.name)}/ <small>${formatNumber(folder.fileCount)}</small></button>`).join('')}</div><div class="district-detail" aria-live="polite"><strong>${escapeHtml(structure.directories[0]?.name || repo.name)}/</strong><span>${formatNumber(structure.directories[0]?.fileCount || data.fileCount)} files in this area</span><a href="${escapeHtml(githubFileUrl(repo, structure.directories[0]?.name || '', 'tree'))}" target="_blank" rel="noreferrer">Open on GitHub ↗</a></div></div><div class="map-scene map-scene-3d hidden"><div id="three-map" class="three-map" role="img" aria-label="Interactive 3D repository landscape"></div><p class="three-caption">Drag to look around · click a district to select · scroll to zoom</p></div>${rootFiles ? `<div class="root-file-list" aria-label="Top-level files">${rootFiles}</div>` : ''}${data.treeTruncated ? '<p class="tree-warning">GitHub shortened this large file tree; directory counts may be partial.</p>' : ''}</section>
        <section class="info-card"><div class="card-head"><h3>From the README</h3><span class="card-meta">PROJECT SIGNAL</span></div>${readmeContent}</section>
      </div>
      <div class="result-column">
        <section class="info-card"><div class="card-head"><h3>Language mix</h3><span class="card-meta">BY CODE SIZE</span></div><div class="language-card-body">${renderLanguages(data.languages)}</div></section>
        <section class="info-card"><div class="card-head"><h3>Directory footprint</h3><span class="card-meta">FILES PER FOLDER</span></div><div class="directory-chart">${renderDirectoryChart(structure.directories, repo)}</div></section>
        <section class="info-card anatomy-card"><div class="card-head"><h3>Project anatomy</h3><span class="card-meta">PATH SIGNALS</span></div><div class="anatomy-body">${renderStructureAnalysis(structure)}</div></section>
        <section class="info-card"><div class="card-head"><h3>Good first files</h3><span class="card-meta">A PLACE TO BEGIN</span></div><ul class="start-list">${recommended || '<li class="readme-copy">No files found in the repository tree.</li>'}</ul></section>
        <section class="info-card ai-card" aria-live="polite" aria-busy="${aiState === 'loading'}"><div class="card-head"><h3>AI field guide</h3><span class="card-meta">${aiLabel}</span></div><div class="tour-tools"><p>Choose a question and explore this repository with a grounded guide.</p><div class="tour-prompts"><button type="button" data-question="Explain this repository in plain language and cite the best files to understand it.">What is this project?</button><button type="button" data-question="What should I know about the selected folder? Explain its likely role using its path and nearby files.">Explain this area</button><button type="button" data-question="Suggest a short reading route through this project using only paths in the file list.">Where should I start?</button></div><form id="tour-form" class="tour-form"><label class="sr-only" for="tour-question">Ask about this repository</label><input id="tour-question" type="text" maxlength="300" placeholder="Ask about this repo…"><button type="submit">Ask <span aria-hidden="true">↗</span></button></form><p class="tour-privacy">Only after you ask, RepoLens sends the README, file paths, and your question to the configured AI provider.</p><div id="tour-response" class="tour-response" aria-live="polite">${aiContent}</div></div></section>
      </div>
    </div>
  `;
  document.querySelector('#new-repo-button').addEventListener('click', () => {
    input.focus();
    document.querySelector('#repo-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.querySelectorAll('.district-chip').forEach((chip) => chip.addEventListener('click', () => selectDistrict(chip.dataset.folder)));
  document.querySelectorAll('[data-map-mode]').forEach((mode) => mode.addEventListener('click', () => toggleMapMode(mode.dataset.mapMode)));
  document.querySelectorAll('[data-filter]').forEach((filter) => filter.addEventListener('click', () => filterDistricts(filter.dataset.filter)));
  document.querySelectorAll('[data-zoom]').forEach((zoom) => zoom.addEventListener('click', () => zoomMap(zoom.dataset.zoom)));
  document.querySelector('#challenge-start').addEventListener('click', startChallenge);
  document.querySelectorAll('[data-question]').forEach((prompt) => prompt.addEventListener('click', () => askTour(prompt.dataset.question)));
  document.querySelector('#tour-form').addEventListener('submit', (event) => { event.preventDefault(); const question = document.querySelector('#tour-question').value.trim(); if (question) askTour(question); });
  results.classList.remove('hidden');
}

let currentRepoData = null;
let selectedRepoFolder = '';
let threeCleanup = null;

function selectDistrict(name) {
  selectedRepoFolder = name;
  document.querySelectorAll('.district-chip').forEach((chip) => chip.classList.toggle('selected', chip.dataset.folder === name));
  const folder = currentRepoData?.structure?.directories?.find((entry) => entry.name === name);
  const detail = document.querySelector('.district-detail');
  if (detail && folder) detail.innerHTML = `<strong>${escapeHtml(folder.name)}/</strong><span>${formatNumber(folder.fileCount)} files · ${(folder.children || []).slice(0, 3).map((item) => escapeHtml(item.name)).join(' · ') || 'Top-level files'}</span><a href="${escapeHtml(githubFileUrl(currentRepoData.repository, folder.name, 'tree'))}" target="_blank" rel="noreferrer">Open on GitHub ↗</a>`;
  if(challenge&&!challenge.done&&(currentRepoData.structure.roles[challenge.role]?.folders||[]).includes(name)){challenge.done=true;document.querySelector('#challenge-text').textContent=`Found it: ${name}/ is a strong ${challenge.label} signal. Nice exploring!`;document.querySelector('#challenge-start').textContent='Challenge complete ✓';document.querySelector('.map-challenge').classList.add('challenge-won');}
}

function filterDistricts(role) {
  document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === role));
  const folders=currentRepoData?.structure?.roles?.[role]?.folders||[];
  document.querySelectorAll('.district-chip').forEach((chip)=>{chip.hidden=role!=='all'&&!folders.includes(chip.dataset.folder);});
}

let mapZoom=1;
function zoomMap(direction){mapZoom=Math.max(.75,Math.min(1.5,mapZoom+(direction==='in'?.1:-.1)));const graph=document.querySelector('.repo-graph');if(graph)graph.style.transform=`scale(${mapZoom})`;}

let challenge=null;
function startChallenge(){const options=[{role:'tests',label:'test'},{role:'docs',label:'documentation'},{role:'source',label:'source code'}].filter(item=>(currentRepoData?.structure?.roles?.[item.role]?.folders||[]).length);if(!options.length){document.querySelector('#challenge-text').textContent='No clear code, test, or docs folder signal here—inspect the root files instead.';return;}const next=options[Math.floor(Math.random()*options.length)];challenge={...next,done:false};document.querySelector('#challenge-text').textContent=`Find the folder that most likely contains ${next.label}. Tap a district to inspect it.`;document.querySelector('#challenge-start').textContent='Choose a district';document.querySelector('.map-challenge').classList.remove('challenge-won');}

async function toggleMapMode(mode) {
  document.querySelectorAll('[data-map-mode]').forEach((button) => { const active = button.dataset.mapMode === mode; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  document.querySelector('.map-scene-2d').classList.toggle('hidden', mode !== '2d');
  document.querySelector('.map-scene-3d').classList.toggle('hidden', mode !== '3d');
  if (mode === '3d' && !threeCleanup) await buildThreeMap();
}

async function buildThreeMap() {
  const host = document.querySelector('#three-map');
  if (!host || !currentRepoData) return;
  host.innerHTML = '<div class="three-loading">Preparing your landscape…</div>';
  try {
    const THREE = await import('https://esm.sh/three@0.181.2');
    const { OrbitControls } = await import('https://esm.sh/three@0.181.2/examples/jsm/controls/OrbitControls.js?external=three');
    if (!host.isConnected) return;
    host.innerHTML = '';
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#edf3ef'); scene.fog = new THREE.Fog('#edf3ef', 18, 44);
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 100); camera.position.set(0, 11, 18);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.setSize(host.clientWidth, host.clientHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; host.append(renderer.domElement);
    scene.add(new THREE.HemisphereLight('#fffef8', '#a3b8ae', 2)); const sun = new THREE.DirectionalLight('#fff5dc', 2.3); sun.position.set(-5, 12, 7); sun.castShadow = true; scene.add(sun);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2.05; controls.minDistance = 9; controls.maxDistance = 28; controls.target.set(0, 1.2, 0);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: '#e2eae3', roughness: 1 })); ground.rotation.x = -Math.PI/2; ground.position.y = -.14; ground.receiveShadow = true; scene.add(ground);
    const colors = ['#4b8da2','#df8060','#c79a3e','#8672ad','#5b9076','#c57492'];
    const dirs = currentRepoData.structure.directories.slice(0, 12); const max = Math.max(1, ...dirs.map((d) => d.fileCount)); const meshes=[];
    dirs.forEach((dir,i)=>{const col=i%4,row=Math.floor(i/4),x=(col-1.5)*3.2,z=(row-1)*4.1,w=1.8+Math.min(1,dir.fileCount/max)*.7,h=.65+Math.sqrt(dir.fileCount/max)*3.2;const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,1.8),new THREE.MeshStandardMaterial({color:colors[i%colors.length],roughness:.62}));mesh.position.set(x,h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={name:dir.name};scene.add(mesh);meshes.push(mesh);const label=makeLabel(THREE,dir.name+'  '+formatNumber(dir.fileCount));label.position.set(x,h+.48,z);scene.add(label);});
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let frame=0;let paused=false;
    const resize=()=>{if(!host.clientWidth)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
    const click=(event)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes)[0];if(hit)selectDistrict(hit.object.userData.name);};
    const animate=()=>{if(!paused){controls.update();renderer.render(scene,camera);}frame=requestAnimationFrame(animate);}; animate(); renderer.domElement.addEventListener('click',click); const observer=new ResizeObserver(resize);observer.observe(host);const visibility=()=>{paused=document.hidden;};document.addEventListener('visibilitychange',visibility);
    threeCleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);renderer.dispose();controls.dispose();};
  } catch (error) { host.innerHTML='<p class="three-error">The 3D view could not load. Use the 2D map, which has the same folder details.</p>'; console.warn('3D map unavailable',error); }
}

function makeLabel(THREE,text){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=72;const ctx=canvas.getContext('2d');ctx.fillStyle='#fffefa';ctx.strokeStyle='#cbd8d1';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(2,2,316,68,12);ctx.fill();ctx.stroke();ctx.fillStyle='#203d49';ctx.font='600 25px sans-serif';ctx.fillText(text.slice(0,20),16,45);const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true}));sprite.scale.set(2.3,.52,1);return sprite;}

async function askTour(question) {
  const output=document.querySelector('#tour-response');if(!output||!currentRepoData)return;
  output.innerHTML='<div class="ai-progress"><span class="ai-pulse"></span><p>Following the paths in this repository…</p></div>';
  document.querySelector('.ai-card')?.setAttribute('aria-busy','true');
  try { const response=await fetch('/api/tour',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...currentRepoData,question,selectedFolder:selectedRepoFolder})});const data=await response.json();if(!response.ok)throw new Error(data.error||'The tour is unavailable.');let answerHtml=renderMarkdown(data.answer);for(const file of currentRepoData.files){const token=`<code>${escapeHtml(file.path)}</code>`;if(answerHtml.includes(token))answerHtml=answerHtml.replaceAll(token,`<a class="tour-file-link" href="${escapeHtml(githubFileUrl(currentRepoData.repository,file.path))}" target="_blank" rel="noreferrer"><code>${escapeHtml(file.path)}</code> ↗</a>`);}output.innerHTML=`<div class="tour-answer">${answerHtml}</div><p class="tour-evidence">Based on repository metadata, its README and file paths. Verify details in the linked files.</p>`; }
  catch(error){output.innerHTML=`<p class="tour-error">${escapeHtml(error.message)}</p>`;}
  finally{document.querySelector('.ai-card')?.setAttribute('aria-busy','false');}
}

function renderLoading() {
  results.innerHTML = '<div class="loading-panel"><div class="loading-glyph" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="19" cy="19" r="12"/><path d="m28 28 11 11M12 17h14M12 22h9"/></svg></div><div class="loading-copy"><h2>Tracing the repo</h2><p>Reading its branch, file map, and language signals.</p><div class="loading-track" aria-hidden="true"><span></span></div></div></div>';
  results.classList.remove('hidden');
}

function renderError(error) {
  results.innerHTML = `<div class="error-panel"><span class="error-icon" aria-hidden="true">!</span><div class="error-copy"><h2>Couldn't map that repository</h2><p>${escapeHtml(error.message || 'Something went wrong. Try again.')}</p></div></div>`;
  results.classList.remove('hidden');
}

async function analyze(url) {
  const run = ++activeRun;
  input.value = url;
  button.disabled = true;
  button.querySelector('span:first-child').textContent = 'Mapping…';
  message.textContent = 'Checking the repository map';
  message.classList.remove('error-message');
  results.setAttribute('aria-busy', 'true');
  renderLoading();
  results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  let data;
  try {
    const repoResponse = await fetch(`/api/repo?url=${encodeURIComponent(url)}`);
    data = await repoResponse.json();
    if (!repoResponse.ok) throw new Error(data.error || 'Could not read that repository.');
  } catch (error) {
    if (run !== activeRun) return;
    message.textContent = error.message;
    message.classList.add('error-message');
    renderError(error);
    button.disabled = false;
    button.querySelector('span:first-child').textContent = 'Map this repo';
    results.setAttribute('aria-busy', 'false');
    return;
  }

  if (run !== activeRun) return;
  renderResults(data, null, 'off');
  results.setAttribute('aria-busy', 'false');
  message.textContent = `Map ready · ${formatNumber(data.fileCount)} files found`;
  button.disabled = false;
  button.querySelector('span:first-child').textContent = 'Map this repo';
}

let activeRun = 0;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (input.reportValidity()) analyze(input.value.trim());
});

document.querySelectorAll('[data-repo]').forEach((example) => {
  example.addEventListener('click', () => analyze(example.dataset.repo));
});
