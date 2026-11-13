# PRISM

**Continuous AI auditing for your pull requests.**

PRISM connects to your GitHub account, lets you pick any repository (public or private), and runs an AI code review on a pull request of your choice. The review is shown next to the changed code, with a score, a summary, and a list of findings that tell you what is wrong and how to fix it.

> **Status:** under active development. The core flow works end to end. See the [Roadmap](#roadmap) for what is coming next.

---

## Why PRISM

Most AI code review tools are paid, and most of them only look at the diff. PRISM is being built to give developers useful, specific feedback for free, and later to understand the whole codebase around a change (see [RAG](#roadmap)).

---

## How it works

1. **Connect GitHub** from the home page using GitHub OAuth.
2. **Dashboard:** see all your repositories, public and private.
3. **Pick a repository** to list its pull requests.
4. **Pick a pull request** to open the review page, which shows the changed files and code diff.
5. **Run an analysis.** PRISM fetches the PR and its files from GitHub, filters out files that are not worth reviewing, sends the rest to OpenAI, validates the structured response, and saves it.
6. **Read the result:** score, summary, and findings by severity and category. Past reviews are kept, so you can compare the latest analysis with the previous one.

```mermaid
flowchart LR
    A[Connect GitHub OAuth] --> B[Dashboard: repos]
    B --> C[Pull request list]
    C --> D[Review page]
    D --> E[Fetch PR and files from GitHub]
    E --> F[Filter non-essential files]
    F --> G[Build prompt]
    G --> H[OpenAI + Zod structured output]
    H --> I[(PostgreSQL)]
    I --> D
```

---

## Features

- GitHub OAuth login, with the access token stored encrypted
- Browse all of your repositories and their pull requests
- In-app code diff viewer for changed files
- Smart file filtering before the AI call, to save tokens: lockfiles, images, binaries, build output (`dist/`, `build/`, `.next/`, `coverage/`) and minified files are skipped
- Structured AI output validated with Zod: score, summary, and findings with severity and category
- Review history stored in PostgreSQL, with status tracking (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`)
- Latest vs. previous review comparison

---

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4, GSAP |
| Database | PostgreSQL with Prisma 7 |
| AI | OpenAI (Responses API) |
| Validation | Zod |
| GitHub | GitHub OAuth and REST API |
| Auth / tokens | Cookie sessions, `jose` |

---

## Project structure

```
prisma/                 Database schema and migrations
src/
  app/                  Next.js routes and pages (dashboard, PRs, review)
  controllers/          Request logic (start review, get review, review processor)
  lib/
    ai/                 OpenAI client (reviewClient.js)
    review/             File filter, prompt builder, review schema
    auth.js             Session handling
    github-auth.js      GitHub token handling
    prisma.js           Prisma client
```

> The layout may shift a little as the project grows.

---

## Getting started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL database
- A GitHub OAuth app (GitHub, Settings, Developer settings, OAuth Apps)
- An OpenAI API key

### Setup

```bash
git clone https://github.com/logicscienc/PRISM.git
cd PRISM
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/prism"

GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

OPENAI_API_KEY="your-openai-api-key"

# Add any session or token-encryption secrets your auth setup needs.
```

Set the OAuth app's callback URL to your app's callback route, for example `http://localhost:3000/api/auth/callback`. Use the exact route your code defines.

Run the database migrations and start the dev server:

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Data model

- **User:** GitHub identity and encrypted access token
- **Session:** login sessions
- **Review:** one analysis run for a pull request (repo, PR number, model, status, timing)
- **ReviewResult:** score, summary and per-area notes for a review
- **ReviewFinding:** an individual issue with severity, category, file, message and suggested fix

---

## Roadmap

- [x] GitHub OAuth connection
- [x] Repository dashboard and pull request list
- [x] Diff viewer and AI review with structured (Zod) output
- [x] Review history in PostgreSQL
- [ ] **Line-accurate findings:** point to the exact lines and show the corrected code inline, under the code
- [ ] Merge duplicate findings that share one root cause
- [ ] Support multi-file and large pull requests (chunking, token limits)
- [ ] **RAG for codebase context:** index the repository with embeddings (pgvector), retrieve related code at review time, and review changes with real project context
- [ ] Post review comments back to the pull request on GitHub
- [ ] Move from OAuth to a GitHub App, with webhooks that trigger reviews automatically (HMAC SHA-256 signature verification)
- [ ] Job queue for background review processing
- [ ] Redesigned UI across the dashboard, pull request and review pages

---

## Contributing

This is a personal learning project, but suggestions and issues are welcome.

## License

Not specified yet.
