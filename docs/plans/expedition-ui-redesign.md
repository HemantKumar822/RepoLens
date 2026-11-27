# RepoLens: Full-Screen Codeworld

## Product intent

RepoLens becomes a full-viewport, living 3D world made from the real shape of a public GitHub repository. A visitor should feel like they have stepped into a tiny civilization: folders become districts, files become places/buildings, and friendly pixel spirits help explain what they find. The map remains a useful code-reading tool, not a score screen or a separate game demo.

The Wonderhop reference is art direction only: pixel lettering, warm sunset light, layered scenery, teal water, crisp silhouettes, and a subtle CRT texture. RepoLens uses its own layout, copy, characters, assets, and exploration flow. Do not copy Wonderhop's game mechanics, screen arrangement, art, or wording.

## Goals

- Make the 3D world fill the browser viewport on the title screen and while exploring a repository. No conventional hero-plus-cards page, no boxed map inside a results dashboard, and no three-step marketing section after the map.
- Generate an original island/city from actual repository metadata and tree paths. Folder counts, file names/extensions, repository languages, and README evidence must drive visible world details.
- Let visitors select districts, inspect actual files, follow GitHub links, and ask a character for a simple explanation grounded in a small amount of real source text.
- Give source, tests, documentation, build/configuration, and miscellaneous districts distinct but consistent spirits with recognizable pixel portraits and different speaking styles.
- Keep the experience responsive, keyboard-usable, reduced-motion aware, and functional without an AI key or WebGL.
- Keep deployment on Vercel simple and retain existing GitHub analysis endpoints and server-side Groq/OpenAI support.

## Product loop

1. A beautiful title screen introduces RepoLens and the living-code idea. A visitor pastes a public GitHub URL or chooses a sample; this stays a distinct, full-screen first step.
2. One action starts a deliberate build sequence. RepoLens shows specific progress states while it fetches the metadata/tree; after the response arrives, the camera moves toward the scene and the island, districts, landmarks, and spirits assemble in staggered animation.
3. The completed civilization becomes the full-screen app. A visitor clicks/taps a district, building, or its spirit. A compact HUD identifies the folder, exact file count, role signals, and paths from that district.
4. The visitor opens a real file in GitHub, follows a locally mapped discovery prompt, or starts an optional conversation with that district's spirit.
5. When asked, the spirit receives only the question, selected folder, bounded README/path context, and up to three small text excerpts fetched from matching public files. The response cites paths present in that context and links them back to GitHub.
6. A world-map/blueprint control exposes a clear 2D fallback without leaving the full-screen experience. The journal/atlas HUD surfaces language composition and repository facts on demand.

## Art and world language

- Original procedural voxel/8-bit island with a peach/coral sunset, teal sea, deep blue-green silhouettes, warm paper highlights, and small mint/violet/gold/coral accents.
- A low-resolution rendering treatment, pixel sprite textures, square outlines, layered clouds/waves, small looping ambient details, and quick landing transitions create a living game scene without a large external art download.
- Use a four-beat flow: **title → scan → build → explore**. The scan screen narrates real steps; the build scene animates the actual returned folders into place. Keep copy honest: no percentage claims for work that cannot be measured.
- The world canvas occupies `100vw × 100dvh`; HUD controls float over it. The title screen input and map screen selection controls share the world rather than creating a separate card/page.
- Pixel display font is used sparingly for world titles, HUD labels, and short character names. Readable body type and monospace file paths stay legible at normal sizes.
- UI overlays use thin translucent/dark-edged game HUD plates rather than tall dashboard cards. Keep only the active task visible; spirit dialogue, repository atlas, journal, and settings open as compact overlays/drawers.
- Respect reduced motion: skip ambient drift and animated transitions while keeping selection, map control, and all content usable.

## Data mapping

- Repository: central keep/town square and world nameplate.
- Top-level folders: districts laid out deterministically from their names, so the same repository keeps the same geography.
- Folder `fileCount`: district density/height. It is a size cue only, never a quality score.
- A bounded set of actual file paths from each folder: individual block buildings with short extension-based visual traits and a selectable file inspector. Display exact folder totals separately from sampled building count.
- Source/tests/docs/config role signals: district color/props and spirit role, based only on existing path heuristics.
- Language totals: small on-demand atlas palette/chart and optional building roof accents.
- README, manifests, root files, and selected file contents: evidence for the guide, shown as paths/short excerpts with GitHub links.
- Any truncated tree or sampled building set is labeled so the world never implies that it displays every file.

## Spirits and AI behavior

Initial archetypes:

- **Patch the Maker** — source-code districts; curious, practical, suggests the next file or function to read.
- **Vera the Verifier** — tests; careful, asks what behavior is being checked, explains test names and neighboring code.
- **Page the Archivist** — documentation; patient, explains setup and concepts from actual README/docs.
- **Wrench the Builder** — configuration/build; direct, explains manifests, scripts, and build paths.
- **Moss the Pathfinder** — folders without a strong role signal; friendly, helps navigate known paths and says when evidence is thin.

Spirit names and voice add personality, never facts. The selected character is a front end to the existing `/api/tour` flow. The server chooses from a fixed persona allowlist; repository text is treated as untrusted data. On demand, the server validates a GitHub repository URL, selects no more than three small text files under the selected district, fetches their contents from GitHub, clips total context, calls the configured Groq/OpenAI-compatible provider, and rejects unsupported path citations. No API key or repository data is saved in the browser. Without a configured AI key, the map, NPC hints, file inspector, charts, and GitHub links remain usable.

## Technical direction

- **Frontend:** React + TypeScript + Vite for reusable full-screen game/UI components, fast local iteration, and a small static production bundle.
- **3D:** Three.js through React Three Fiber for a declarative scene, pointer picking, per-frame ambient motion, sprites, and generated geometry. Use Drei only for small focused helpers (camera controls and in-scene labels); no full game engine.
- **Backend:** retain the existing Node.js GitHub analysis and optional AI serverless handlers under `/api`. Refactor their shared helpers only when needed for file-content retrieval; never expose provider keys to browser code.
- **Local development:** Vite proxies `/api` to the existing Node server so the same API behavior is used locally and on Vercel.
- **Deployment:** `vite build` outputs `dist`; Vercel serves the static app and its existing `/api/*.mjs` functions. Vite's TypeScript transpilation does not type-check, so production build runs `tsc --noEmit` before `vite build`.
- **Assets:** original pixel characters/background props are generated as local SVG/canvas/Three.js geometry. Do not download third-party game assets.

## File architecture

- `index.html`: Vite entry document, metadata, font loading, and app mount only.
- `src/main.tsx`: React bootstrap and global stylesheet import.
- `src/App.tsx`: world/session state, repo fetch orchestration, spirit conversation state, and HUD composition.
- `src/types.ts`: shared repository, folder, file, role, persona, and chat message types.
- `src/data/spirits.ts`: fixed spirit archetypes, greetings, fallback tips, and prompt suggestions.
- `src/lib/github.ts`: repository fetch, safe GitHub URL builders, extension/role display data.
- `src/components/WorldCanvas.tsx`: full-viewport R3F Canvas, loading/empty scene, camera bounds, and reduced-motion configuration.
- `src/world/`: deterministic island, district plots, file building clusters, spirit sprites, environmental details, and scene picking.
- `src/components/hud/`: URL/title overlay, repository HUD, folder/file inspector, spirit conversation, atlas/journal, quest hints, and 2D map overlay.
- `src/styles/`: global theme, full-screen world layout, HUD plates, dialogue, and responsive/mobile styles.
- `server.mjs`, `api/*.mjs`: existing server-side GitHub/AI entry points, plus bounded matching-file excerpts for on-demand AI dialogue.
- `vite.config.ts`: Vite config, `/api` dev proxy, aliases if useful, and fixed local UI port.
- `tsconfig.json`, `package.json`, `vercel.json`: strict frontend typing, development/build scripts, and static output config.
- `docs/plans/expedition-ui-redesign.md`: this product and implementation plan.

## Build sequence

1. Replace the current `public` page as an application entry with a Vite/React/TypeScript frontend scaffold; preserve existing GitHub and AI server handlers.
2. Establish a stable frontend data contract and return deterministic bounded per-folder sample file paths from repository analysis.
3. Build the separate full-screen title, scan, and build/reveal phases; remove the old HTML hero, method cards, result card, and old styles.
4. Build deterministic repository districts, file building clusters, interactive picking, map/blueprint view, and a responsive overlay inspector.
5. Add original pixel spirit sprites and role-specific interaction; present the selected district's actual paths and file details.
6. Extend `/api/tour` with fixed spirit personas and bounded selected-folder source excerpts; make dialogue question-driven and path-linked.
7. Add optional map atlas/journal overlays for language mix, README, manifests, and first-file routes; no always-open charts.
8. Wire Vite local API proxy and Vercel static output; update README setup/deploy instructions.
9. Complete implementation/build artifacts and leave the end-to-end playthrough for the user and agent to review together. Do not deploy changes until that review is done.

## Review focus

- A large repository must not cause a huge number of meshes or exceed API response/function budgets; show an honest sample with exact totals.
- Layout must fill the viewport at desktop, tablet, and phone sizes with overlays that do not cover the selected district or hide the main action.
- Every selectable file path and AI citation must match a path the repository endpoint supplied.
- Character voice must not assert repository behavior without file evidence; no automatic AI calls during map creation.
- WebGL import/context failure and absent AI credentials must keep a useful repository exploration flow available.
- No copied Wonderhop art, text, game loop, or layout; recreate the general pixel/sunset mood with original local assets.
