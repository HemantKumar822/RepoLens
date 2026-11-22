# RepoLens

RepoLens helps you get oriented in a public GitHub repository before you dive into the code. It draws a linked map of the largest folders and their subfolders, charts language and directory size, summarizes the README, classifies source/test/docs/build signals, and recommends useful first files. These structural insights work without an AI key. With an OpenAI key, RepoLens adds a short reading tour grounded in the README and file tree.

## Run locally

Requires Node.js 20 or newer. RepoLens has no package dependencies.

```sh
npm start
```

Open <http://127.0.0.1:4173>.

Without an API key, repository metadata, file structure, and language breakdown still work. The AI key stays in the local server process and is never sent to the browser.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep the detected Node.js settings; no build command or install step is needed.
4. Optionally add `OPENAI_API_KEY` in **Project Settings → Environment Variables** to enable AI notes. `OPENAI_MODEL` and `OPENAI_BASE_URL` are optional overrides.
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
- Up to 16,000 characters of the repository README for the optional AI explanation
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
- [ ] Add a live demo link

## Stack

- HTML, CSS, and browser JavaScript
- Node.js built-in HTTP server and `fetch`
- GitHub REST API
- OpenAI Responses API (optional)
