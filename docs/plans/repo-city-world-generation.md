# Repo City World Generation Plan

**Goal:** Make the repository feel like a planned, walkable city whose neighborhoods, buildings, landmarks, and streets come from the real repository tree.

## Research-derived design rules

- Generate a connected street graph first. City blocks and lots must align to it; do not create one private cross-road pattern per folder.
- Give buildings a street-facing lot with a sidewalk setback. A road should join another road at a clear intersection, curve, T-junction, bridge, or city edge.
- Organize the skyline into a recognizable center, neighborhood blocks, parks, and a waterfront. Place props in groups that have a purpose instead of scattering them evenly.
- Use a deterministic seed from `repository.fullName`; the same repository keeps its layout, and different repositories vary through real directory counts, file totals, child folders, and sampled paths.
- A directory with a large path count gets more blocks and/or more occupied lots. Small directories keep compact footprints. Empty cells become intentional parks or civic space.
- Keep exact GitHub counts separate from the bounded set of clickable sample files.

## City grammar

1. Build a lightly rotated, regular road grid sized from the visible directory count and average folder size. Add a main avenue, continuous local streets, and a connected town plaza.
2. Assign contiguous blocks to top-level directories. Use directory file counts to give large areas extra blocks, place the busiest roles near the civic core, and fill unused cells with seeded parks.
3. Split each district block into deterministic lots. The road graph defines sidewalks and lot fronts; actual sampled paths occupy those lots. File extension and size choose a role-appropriate building silhouette and height.
4. Place one role landmark and one spirit destination per district. Keep ambient residents and street furniture sparse; the selected district gets the prominent character interaction.
5. Shape the island coastline around the grid with seeded bays and a harbor edge. Fit the overview camera to the resulting world bounds.

## Assets and runtime

- Keep React Three Fiber and the current analysis/API contracts.
- Bundle a small curated set of low-poly GLB models from `kayquer/kit-cidade-lowpoly`; the upstream README marks the kit CC0, its 2×2 lot scale, and its Three.js support. Include its license and source note in the repository.
- Load assets locally from `public/`; never fetch model files from a third-party host at runtime.
- Preserve exact file links, AI evidence, the 2D fallback, keyboard interaction, reduced-motion support, and Vercel compatibility.
- Keep the 18 visible-directory cap and a maximum of 16 clickable sampled files per district.

## Implementation steps

1. Replace the radial/Voronoi layout with a seeded road grid, connected blocks, contiguous directory ownership, park cells, and lot placements.
2. Rebuild the scene surfaces from those blocks. Render sidewalks, roads, marked crossings, the central plaza, and role-colored district lots in a consistent grid.
3. Replace generic repeated buildings with role- and file-kind-specific silhouettes from the curated low-poly kit. Keep file selection and camera focus deterministic.
4. Align landmarks, spirits, traffic, coastline props, and trees with the city plan. Reduce visible character count in overview and show the selected guide on district focus.
5. Review a low-directory/high-volume repository and a many-directory/small-volume repository in the local browser, run the production build and `git diff --check`, and check that district/file selection still works.

## Review focus

- One, two, and eighteen directories produce connected, compact maps with no empty or inverted regions.
- Every road joins a junction or terminates at a clear island edge; roads, sidewalks, blocks, and buildings line up.
- District ownership remains connected after extra blocks are assigned.
- Building sample counts never replace or misstate full GitHub counts.
- An inspector-visible sampled path maps to the same deterministic world building when selected.
- The same repository produces the same layout; another repository varies through its real structure.
- The generated world remains readable at overview and district focus, including under the inspector.
