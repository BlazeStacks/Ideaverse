# CivicFix AI — Frontend

Frontend for **CivicFix AI**, a civic infrastructure reporting and repair-planning platform.

Citizens submit a photograph of a public-infrastructure problem (pothole, blocked drain, visible water
leak, damaged traffic signal, garbage accumulation, damaged footpath, other civic assets) together with a
location. An AI service — developed **separately**, on another machine — returns a structured assessment
that this interface renders: issue category, severity, confidence, observations, safety concerns, a
suggested department, corrective actions, preliminary resource/cost/duration guidance, missing information
and submission status.

> **Scope of this build:** the frontend only. There is no backend, no AI inference and no database code in
> this directory. Everything that depends on the backend is implemented as an explicit integration point,
> and the interface is honest about what is not available yet.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Environment variables](#environment-variables)
3. [Scripts](#scripts)
4. [Project structure](#project-structure)
5. [Routes and pages](#routes-and-pages)
6. [Backend integration](#backend-integration)
7. [What is implemented vs. placeholder](#what-is-implemented-vs-placeholder)
8. [Deploying to Vercel](#deploying-to-vercel)
9. [Verification performed](#verification-performed)
10. [Conventions](#conventions)

---

## Quick start

Requirements: **Node.js 20.19+** (developed on Node 24) and npm.

```bash
cd frontend
npm install
cp .env.example .env.local     # optional; see Environment variables
npm run dev                    # http://localhost:5173
```

The application runs completely without the backend. Report submission, the results page and the
dashboard all have honest error and empty states, so nothing needs to be stubbed to develop or review the
interface.

---

## Environment variables

Only one variable is required, and it is optional:

| Variable       | Example                 | Purpose                                        |
| -------------- | ----------------------- | ---------------------------------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the separately developed backend.   |

- Copy [`.env.example`](.env.example) to `.env.local` and edit it. `.env*` files are git-ignored;
  `.env.example` is committed on purpose.
- If `VITE_API_URL` is not set, the app falls back to `http://localhost:8000` and says so in the UI.
- **Never put secrets here.** Vite inlines every `VITE_`-prefixed variable into the browser bundle, so
  anything in `.env` is public. The Groq API key, database credentials and any other privileged token
  belong exclusively to the backend environment. The frontend reaches the backend over HTTP only.

---

## Scripts

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the built output on http://localhost:4173
npm run lint      # oxlint
```

---

## Project structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── home/        # landing-page sections (hero, workflow, categories, CTA)
│   │   ├── about/       # About-page sections
│   │   ├── layout/      # header, footer, shell, page header, scroll restoration
│   │   ├── reports/     # reporting + results + dashboard building blocks
│   │   └── ui/          # design-system primitives (button, card, badge, alert, ...)
│   ├── context/         # in-memory analysis session provider
│   ├── hooks/           # useReports, useReportFilters, useDocumentTitle
│   ├── lib/             # constants, formatting, validation, response normalisation
│   ├── pages/           # Home, About, Help, ReportIssue, ReportResults, Dashboard, ReportDetail, NotFound
│   ├── services/        # civicfixApi.js (backend integration), reportsService.js (reports data)
│   ├── App.jsx          # route table
│   ├── index.css        # Tailwind v4 theme tokens + base layer
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── vercel.json          # SPA fallback + framework settings
└── vite.config.js       # React, Tailwind v4 plugin, "@" → src alias
```

### Stack

React 19 · Vite 8 · JavaScript (no TypeScript) · Tailwind CSS v4 · shadcn-style UI primitives
(Radix `Slot`/`Label`, `class-variance-authority`, `tailwind-merge`) · Lucide React icons ·
React Router 7 · Fetch API.

No state-management library is used: the analysis session lives in a small React context and dashboard
data lives in a hook, which is all this scope needs.

---

## Routes and pages

| Route                          | Page             | Notes                                                                |
| ------------------------------ | ---------------- | -------------------------------------------------------------------- |
| `/`                            | Landing          | Hero, three-step overview, category grid, call to action.             |
| `/about`                       | About            | Assessment, complaint preparation, authority guidance, privacy.       |
| `/help`                        | Help             | FAQ and troubleshooting.                                              |
| `/report`                      | Report an issue  | Image upload with drag & drop, validation, location, details.         |
| `/results`                     | Assessment       | Renders the backend response; explains itself when there is none.     |
| `/dashboard`                   | Dashboard        | Stats, search, filters, report list, honest empty state.              |
| `/dashboard/reports/:reportId` | Report detail    | Stored-report view; explains that persistence is not implemented.     |
| `*`                            | Not found        | 404 with navigation.                                                  |

---

## Backend integration

Everything the frontend needs from the backend lives in two files:

- **[`src/services/civicfixApi.js`](src/services/civicfixApi.js)** — base URL configuration, the
  `POST /analyze` request, HTTP error handling, response parsing and the documented extension points.
- **[`src/services/reportsService.js`](src/services/reportsService.js)** — report retrieval (not available
  yet) and the clearly labelled demo dataset used for interface previews.

### Request contract

`POST {VITE_API_URL}/analyze` — `multipart/form-data`:

| Field                | Type   | Notes                                            |
| -------------------- | ------ | ------------------------------------------------ |
| `file`               | File   | JPEG, PNG or WEBP, max 8 MB (validated in-browser). |
| `location`           | string | Free text entered by the citizen.                |
| `additional_details` | string | Optional; empty string when nothing was entered. |

`Content-Type` is deliberately **not** set by the frontend: the browser attaches the multipart boundary.
The request is sent with a 90-second timeout and can be cancelled by the caller.

The agreed (illustrative) response shape is documented in
[`src/lib/analysis.js`](src/lib/analysis.js). Any field may be missing or `null`; the normaliser handles
that and the results page reports exactly which fields were absent.

### How responses are handled

1. `analyzeIssue()` returns the parsed backend body **unmodified**. Nothing is defaulted or invented.
2. `normalizeAnalysis()` maps it into a predictable shape, recording:
   - `missingFields` — documented fields the backend did not return;
   - `unexpectedFields` — extra keys (schema drift, surfaced in the UI);
   - `usable` — false when none of the documented fields are present.
3. The results page renders sections from the normalised object, explaining missing data instead of
   filling it in. Null cost/duration values are shown as "Not available", never as `0`, and a zero
   reported by the backend is flagged as suspicious.

### Failure modes the UI distinguishes

`ApiError.code` carries the real reason, and the report form turns it into specific guidance:

| Code                            | Meaning                                                |
| ------------------------------- | ------------------------------------------------------ |
| `network_error`                 | Service unreachable (not started, wrong port, CORS).    |
| `timeout`                       | No response within the timeout window.                  |
| `http_error`                    | Non-2xx response, including the backend's `detail`.     |
| `malformed_response`            | Success status but the body is not JSON.                |
| `unexpected_schema`             | JSON, but not an object matching the documented shape.  |
| `validation_error`              | Blocked in the frontend before any upload.              |
| `aborted`                       | Cancelled before completion.                            |

### Probe endpoint (optional)

`GET {VITE_API_URL}/health` is used only by the **Test backend connection** button on the report page.
A 404 there means "reachable but no health route", which is reported as such — the documented contract
only guarantees `POST /analyze`.

### CORS

CORS is the backend's responsibility. Allow the frontend origin (for example `http://localhost:5173` for
development, and the deployed Vercel domain for preview/production). Do not add a proxy layer to work
around it; that hides the real configuration problem.

### Authentication extension point

There is no login and none is simulated. `src/services/civicfixApi.js` documents how to inject an
`Authorization` header once the backend can verify credentials, and `BACKEND_DEPENDENCIES` in
`src/lib/constants.js` lists what remains unimplemented.

---

## What is implemented vs. placeholder

**Implemented**

- Landing page, navigation, footer, responsive layout, accessible focus states.
- Reporting form: drag & drop, click-to-browse, preview, replace, remove, optional geolocation,
  client-side validation (type, size, location length, disclosure length), loading and error states.
- `POST /analyze` integration through a single service module, with truthful failure reporting.
- Results interface: category, severity (text + icon + scale), confidence, description, observations,
  safety concerns, suggested department, corrective actions, materials/equipment, cost and duration
  estimates, site-inspection flag, missing information, authority status, response-completeness notes and
  a raw-response panel.
- Dashboard: summary cards, search, category/severity/status filters, table (desktop) and cards (mobile),
  detail navigation, empty/filtered/loading states, clearly labelled demo data.

**Placeholder — deliberately not functional**

- Report persistence and report history (`GET /reports` does not exist yet).
- Government/authority submission — never simulated; an analysis is not a complaint.
- Jurisdiction routing — only the department suggested by the model is displayed.
- Interactive incident map — no invented incidents are plotted.
- Authentication, roles and administrative actions (assign, change status) — rendered as disabled with an
  explanation.

---

## Deploying to Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend`. Vercel detects Vite; the settings in
   [`vercel.json`](vercel.json) also state them explicitly:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add the environment variable under **Settings → Environment Variables**:
   - `VITE_API_URL` = the deployed backend base URL (no trailing slash), for **Production** and
     **Preview** as needed.
   - Vite inlines environment variables at build time, so **redeploy** after changing it.
   - No other variables are needed, and no secret should be added here.
4. SPA routing: `vercel.json` contains a rewrite of every path to `/index.html` so direct navigation to
   `/report`, `/results` or `/dashboard/...` does not 404. Vercel checks the filesystem first, so hashed
   assets are still served normally.

Local development keeps working with no backend deployed: the request simply fails, and the UI explains
why.

---

## Verification performed

Checked locally with the dev server and a production build:

- `npm run lint` — clean; `npm run build` — successful.
- Routes `/`, `/report`, `/results`, `/dashboard`, `/dashboard/reports/:id`, unknown paths — all render,
  no console errors, no horizontal overflow at a 373 px-wide viewport.
- Form validation: unsupported MIME type, oversized file (9 MB), and missing fields all produce inline and
  form-level messages; focus moves to the first invalid field.
- Real image pipeline: a generated JPEG previews in the drop zone and renders on the results page.
- Backend absent: submission shows the genuine network error and no result is fabricated.
- Response rendering: checked against the documented payload (null cost/duration → "Not available",
  `needs_site_inspection` banner, `authority_status: not_submitted`) and a second variant
  (`is_civic_issue: false`, `Critical`, populated cost range, unknown extra field, non-`not_submitted`
  authority status).
- Dashboard: empty state with "—" statistics, `GET /reports` failure reported as HTTP 404, labelled demo
  data, working search/filters, detail navigation, and the honest "cannot be loaded" state on direct load.
- Refresh behaviour on `/results` — explains that results are held in memory and were cleared.

**Not verified:** the real backend integration. The AI backend was not available on this machine, so the
`POST /analyze` request/response cycle was exercised against a temporary local HTTP stub that is not part
of this repository. Confirm the actual schema with the backend before relying on it.

---

## Conventions

- Path alias `@/` → `src/`.
- Design tokens live in `src/index.css`; components use semantic utilities (`bg-card`,
  `text-muted-foreground`, `border-border`) rather than raw palette colours.
- Severity and status are always communicated with text and an icon, never by colour alone.
- No image data or personal data is written to `localStorage` or placed in a URL. Analysis results live in
  memory for the current tab and are cleared on refresh, on purpose.
