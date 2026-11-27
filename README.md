# RepoLens

RepoLens turns a public GitHub repository into a small, explorable pixel world. Folders become districts, a sample of real file paths becomes buildings, and character guides help students find their way through the code.

## Run locally

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Open <http://localhost:5173>. Vite serves the interface and proxies `/api` requests to the local Node server on port 4173.

The 3D world, file map, GitHub links, journal, and 2D blueprint work without an AI key. To enable the on-demand file guide, copy `.env.example` to `.env` and set `GROQ_API_KEY`. The optional `GROQ_MODEL` setting selects the Groq model. `OPENAI_API_KEY` is supported as a fallback. Provider keys stay on the server.

## Build and serve

```sh
npm run build
npm start
```

The build checks the TypeScript source and creates the static site in `dist`. The local Node server serves that build and the `/api/repo`, `/api/analyze`, and `/api/tour` routes.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. Vercel uses `npm run build` and the `dist` output directory from `vercel.json`.
3. Add `GROQ_API_KEY` under Vercel Project Settings → Environment Variables to enable the character guide. Add it to Production and Preview if both should support AI.
4. Deploy. The static client and existing Node.js API handlers are deployed together.

Keep `.env` out of Git. Provider keys are read only by the server-side handlers.

## How the world is built

- GitHub's repository metadata, language totals, README, and recursive tree provide the map data.
- Each top-level folder becomes a district, positioned in a stable order. District size reflects its file count.
- Buildings and the inspector show a bounded sample of actual file paths. Totals remain separate from that sample. A truncated GitHub tree is labeled.
- A district's AI guide is selected from explicit folder names and repository signals: source, tests, documentation, configuration, or general navigation. Each guide has a distinct role and voice.
- Guide replies use a compact field-note format: a headline, a plain-language answer, up to three clues, one tappable follow-up, and links to the exact files used. The server fetches up to three small text files from the chosen district, keeps the request bounded, and validates every evidence path against those files. Repository text is treated as untrusted input.
- No repository history or AI conversations are saved by RepoLens.

## Stack

- React, TypeScript, Vite
- Three.js, React Three Fiber, Drei
- Node.js built-in HTTP server and Vercel Node.js functions
- GitHub REST API
- Groq Chat Completions API (optional) and OpenAI-compatible fallback

## Design notes

The scene and spirit characters are procedural and original. Wonderhop informed the pixel-art and warm landscape mood only; its art assets, wording, page structure, and game flow are not used.
