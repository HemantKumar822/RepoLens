# Living Codeworld Polish Plan

**Goal:** Make the repository island read as a lively, explorable place instead of repeated block clusters.

**Direction:** Keep the existing pixel-sunset identity and real GitHub mapping. Add original procedural Three.js set pieces that make repository roles visually distinct, connect districts to the town square, and animate the camera toward a selected district. Start the world with no district panel open so the full scene can be appreciated first.

**Constraints:** No external game art or added runtime dependencies. Continue using bounded file samples and deterministic layouts. Preserve the 2D blueprint fallback, exact file links, existing AI grounding, responsive HUD, and reduced-motion support. Leave the hands-on playthrough for the user and Codex together; use the production build as the code-level check.

## Work

- [x] **Give the world a stronger silhouette and landmarks.** Replace the regular polygon island slab with an irregular layered coastline; add paths from the central square, and role-specific landmarks for source, tests, docs, config, and general districts. Keep the existing sample-file houses as readable details, with more roof variation by file kind. Add a small number of ambient world details without increasing per-file geometry without bounds.
- [x] **Make selection feel like entering a place.** Use smooth camera focus when a district or one of its buildings is selected, reset to the full-island framing when selection closes, and avoid opening the inspector automatically after the world is built.
- [x] **Review and hand off.** Verify TypeScript and the Vite production build, review the changed files and resulting bundle sizes, keep the local dev server available, and do not push or deploy before the joint walkthrough.

## Next product layer

Turn exploration into a short, optional learning trail tied to real repository evidence. A trail should help the visitor find an entry point, follow one clear path between repository areas, and use a spirit to explain what the selected files show. Every step should name real paths and link to the source; avoid points or achievements for clicks that do not help someone understand the code.

## Files

- Create `src/world/WorldSetpieces.tsx` for deterministic island, road, landmark, and ambient prop components.
- Modify `src/world/WorldScene.tsx` to compose those pieces, vary file-building silhouettes, and use smooth focus controls.
- Modify `src/App.tsx` so a new world opens on an unselected, unobstructed island.
- Update this plan as the work is completed.

## Review focus

- District count and file count must remain independent of the number of rendered sample buildings.
- Role colors and landmarks must remain distinguishable at the overview camera distance.
- District re-selection and file selection must refocus after a manual orbit, while closing the inspector returns to a useful overview.
- The map fallback must open real district details and preserve file links and spirit dialogue without WebGL.
- Reduce-motion preferences must stop ambient motion and make camera focus immediate without preventing selection.
