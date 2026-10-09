# CivicFix AI — Frontend

Frontend for **CivicFix AI**, a civic infrastructure reporting and repair-planning platform.

Citizens submit a photograph of a public-infrastructure problem (pothole, blocked drain, visible water
leak, damaged traffic signal, garbage accumulation, damaged footpath, other civic assets) together with a
location. The CivicFix backend (`../backend`, FastAPI + a Groq vision model) returns a structured assessment
that this interface renders: issue category, severity, confidence, observations, safety concerns, a
suggested department, corrective actions, preliminary resource/cost/duration guidance, missing information
and submission status.

> **Scope of this directory:** the frontend only. There is no AI inference and no database code here. The
> app talks to the backend over HTTP (`POST /analyze`, `POST/GET /reports`).

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

The pages load without the backend, but analysing a report needs it running (see the root README for
`uvicorn main:app --port 8000` and the `GROQ_API_KEY` it requires). If it is not running, submission shows
the real network error and the form keeps your input; nothing is stubbed.

---

## Environment variables

Only one variable is used, and it is optional:

| Variable       | Example                 | Purpose                                        |
| -------------- | ----------------------- | ---------------------------------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the CivicFix backend.               |

- Copy [`.env.example`](.env.example) to `.env.local` and edit it. `.env*` files are git-ignored;
  `.env.example` is committed on purpose.
- If `VITE_API_URL` is not set, the app falls back to `http://localhost:8000` and says so in the UI.
- **Never put secrets here.** Vite inlines every `VITE_`-prefixed variable into the browser bundle, so
  anything in `.env` is public. The Groq API key belongs exclusively to `backend/.env`. The frontend
  reaches the backend over HTTP only.

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
- **[`src/services/reportsService.js`](src/services/reportsService.js)** — saving and loading reports through
  the backend, plus the clearly labelled demo dataset used for interface previews.

### Request contract

`POST {VITE_API_URL}/analyze` — `multipart/form-data`, verified against `backend/main.py`:

| Field                | Type   | Notes                                                                 |
| -------------------- | ------ | --------------------------------------------------------------------- |
| `file`               | File   | JPEG, PNG or WEBP, max 8 MB (also validated in-browser).              |
| `location`           | string | Typed location plus landmark; GPS coordinates only if nothing was typed. Backend reads 500 chars. |
| `additional_details` | string | The citizen's notes, then the chosen category and follow-up answers as text. Backend reads 1500 chars. |

The backend has no category or coordinate fields, so none are sent (see
[`src/lib/reportPayload.js`](src/lib/reportPayload.js) for exactly how they are folded into text, and
[`src/services/civicfixApi.js`](src/services/civicfixApi.js) for the request). `Content-Type` is deliberately
**not** set by the frontend: the browser attaches the multipart boundary. The request has a 90-second
timeout and can be cancelled. A second submit while one is running is ignored.

The response shape is documented in the root README and normalised by
[`src/lib/analysis.js`](src/lib/analysis.js). Any field may be missing or `null`; the normaliser handles that
and the results page reports exactly which fields were absent.

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
| `duplicate_submission`          | A request was already running; the second was ignored.  |

### Probe endpoint

`GET {VITE_API_URL}/health` is used only by the **Test backend connection** button on the report page. It
confirms the server is up; it does not test the Groq key or model.

### CORS

CORS is the backend's responsibility. It allows the origins in the backend's `CORS_ORIGINS` setting
(default: Vite dev and preview ports on `localhost` / `127.0.0.1`). If Vite starts on another port, or you
deploy to Vercel, add that origin there. Do not add a proxy layer to work around it.

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
- `POST /analyze` integration through a single service module, with truthful failure reporting and
  duplicate-submission protection.
- Results interface: category, severity (text + icon + scale), confidence, description, observations,
  safety concerns, suggested department, corrective actions, materials/equipment, cost and duration
  estimates, site-inspection flag, missing information, authority status, response-completeness notes and
  a raw-response panel.
- Dashboard: summary cards, search, category/severity/status filters, table (desktop) and cards (mobile),
  detail navigation, empty/filtered/loading states, clearly labelled demo data.

**Out of scope**

- Government/authority submission — never simulated; an analysis is not a complaint.
- Jurisdiction routing — only the department suggested by the model is displayed.
- Authentication, roles and administrative actions (assign, change status).

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

Deploy the backend separately and add the Vercel domain to its `CORS_ORIGINS`. Without a reachable
backend the request fails and the UI explains why.

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

**Verified after wiring to the real backend contract:** the request builder and response handling were
checked in Node against a local stand-in server (exactly three multipart fields, multipart boundary, HTTP
400/413/415/422/502 and non-JSON error bodies, timeout, abort, network failure, null cost/duration, the
backend-added `model` field). **Not verified in this environment:** `npm run lint`, `npm run build`, and a real
browser-to-backend request, because dependencies could not be installed and no `GROQ_API_KEY` was available.
Run them locally before relying on the integration.

---

## Conventions

- Path alias `@/` → `src/`.
- Design tokens live in `src/index.css`; components use semantic utilities (`bg-card`,
  `text-muted-foreground`, `border-border`) rather than raw palette colours.
- Severity and status are always communicated with text and an icon, never by colour alone.
- No image data or personal data is written to `localStorage` or placed in a URL. Analysis results live in
  memory for the current tab and are cleared on refresh, on purpose.
