# RepoLens

RepoLens helps you get oriented in a public GitHub repository before you dive into the code. Explore its folder landscape in an interactive 2D map or optional 3D view, chart languages and folder sizes, inspect structural signals, and ask an AI guide questions grounded in the repository README and file paths.

## Run locally

Requires Node.js 20 or newer. RepoLens has no package dependencies.

```sh
npm start
```

Open <http://127.0.0.1:4173>.

Without an API key, repository metadata, file structure, and charts still work. Add `GROQ_API_KEY` to `.env` for the AI field guide (Groq is preferred); `GROQ_MODEL` is optional. `OPENAI_API_KEY` remains supported as a fallback. Keys stay server-side and are never sent to the browser.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep the detected Node.js settings; no build command or install step is needed.
4. Optionally add `GROQ_API_KEY` in **Project Settings → Environment Variables** to enable the AI field guide. Set `GROQ_MODEL` to override its model. OpenAI keys remain supported as a fallback.
5. Deploy. Static assets are served from `public/`; `/api/repo` and `/api/analyze` run as a Node.js function.

For GitHub's new-repository flow, create an empty repository (without an auto-generated README/license), then run:

```sh
git init -b main
git add .
git commit -m "Prepare RepoLens for deployment"
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

Replace `OWNER/REPOSITORY` with the new repository path. Never commit `.env`; add secrets through Vercel's environment variable settings.

## What it reads

- Public repository metadata from the GitHub REST API
- The recursive file tree, root folders, and language breakdown
- Directory sizes, common project manifests, and source/test/docs/build path signals
- Up to 16,000 characters of the repository README and a limited set of paths for AI explanations
- No repository cloning or persistent analysis history

RepoLens does not clone a repository or store analysis results. GitHub's unauthenticated API rate limits apply.

## Capstone roadmap

- [x] Repository URL intake and validation
- [x] Public GitHub metadata, file tree, and language map
- [x] Linked visual folder map, README summary, and first-file recommendations
- [x] Language composition and directory footprint charts
- [x] Local structure analysis for code, tests, docs, and build configuration
- [x] Server-side optional AI reading notes
- [x] Responsive interface and useful failure messages
- [ ] RAG over selected repository files
- [ ] Save and compare repository field notes
- [x] Vercel serverless API and deployment configuration
- [x] Interactive 2D folder explorer with filters, selection, and zoom
- [x] Optional 3D repository landscape
- [x] AI field guide endpoint compatible with Groq and OpenAI
- [ ] Add a live demo link

## Stack

- HTML, CSS, and browser JavaScript
- Node.js built-in HTTP server and `fetch`
- GitHub REST API
- Groq Chat Completions API (preferred, optional)
- OpenAI Chat Completions API (optional fallback)
