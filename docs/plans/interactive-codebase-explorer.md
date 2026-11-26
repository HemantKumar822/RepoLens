# RepoLens interactive explorer — implementation plan

## Goal

Turn RepoLens from a static repository report into an approachable, playful codebase explorer with a dependable 2D map, optional 3D landscape, and grounded AI field guide.

## Product decisions

- Keep the current light cartographic style; make the map the signature interaction.
- 2D remains the default and accessible path: choose a folder, filter code/tests/docs, zoom the map, inspect a folder and open it on GitHub.
- Offer Three.js as an opt-in 3D view, loaded only when selected; keep it decorative and navigable, with reduced motion / non-WebGL fallback to 2D.
- Add a small deterministic discovery challenge to make repo exploration playful without making the model grade users.
- Use Groq Chat Completions by default when `GROQ_API_KEY` is configured; preserve OpenAI key fallback. Keep all keys on the server.
- The model can explain only the supplied README, stats and file paths; label this evidence, avoid invented path citations, and disclose that source text is sent to the configured AI provider.

## Implementation sequence

1. Add a Groq-compatible model provider and a `/api/tour` handler; keep API errors legible and no-key behavior explicit.
2. Add folder selection, filters, zoom and inspection details to the existing SVG map.
3. Add an on-demand 3D landscape built from actual directory counts and colors; clicking a tower selects that folder.
4. Add the field challenge and guided question controls; scope prompts to the selected folder and repository evidence.
5. Add responsive, keyboard-visible and reduced-motion behavior; update setup/deployment documentation.
6. Check syntax and inspect the live app and APIs on desktop and narrow viewports; fix issues found before completion.

## Progress

- [x] Groq/OpenAI-compatible tour service and API route
- [x] Interactive 2D map selection, category filters, zoom and folder details
- [x] Lazy optional Three.js landscape with folder selection
- [x] Beginner field questions and discovery challenge
- [x] Environment and deployment notes
- [ ] Browser review and deployed flow verification
