# CivicFix AI

CivicFix AI helps citizens report civic infrastructure problems — potholes, blocked drains, visible water
pipeline leaks, damaged traffic signals, garbage accumulation, damaged footpaths and similar publicly
maintained assets — and helps authorities review an AI-assisted assessment of each report.

A citizen uploads a photograph and a location. An AI service returns a structured assessment: what the
issue appears to be, how severe it looks, how confident the model is, what is visibly wrong, which safety
concerns exist, which department usually handles it, what a repair would involve, and which details are
still missing before work can be planned.

---

## Repository layout

```
civicfix-ai/
├── frontend/     # React + Vite application — see frontend/README.md
├── backend/      # FastAPI service: main.py, requirements.txt, .env.example
├── README.md     # this file
└── .gitignore
```

The backend is a single module, `backend/main.py`. It validates the uploaded image, sends it to a Groq vision
model (`qwen/qwen3.8-27b`) and returns a validated JSON assessment. It has no database and no authentication.

---

## Independent development

The two halves of the project are developed separately and joined only through an HTTP contract:

- **Frontend** — React, Vite, JavaScript, Tailwind CSS. Runs on its own, with no backend required for
  development or review.
- **Backend** — Python, FastAPI, AI inference. Owns the model, the database and all privileged secrets.

Rules that keep the merge surface small:

1. All frontend application code, dependencies and configuration live under `frontend/`.
2. All backend code lives under `backend/`.
3. There are no shared config files at the root beyond this README and a `.gitignore` that ignores
   build output, dependencies, editor files and local `.env` files. Backend-specific ignores belong in
   `backend/.gitignore`, owned by the backend developer.
4. Each side keeps its own dependency manifest and lockfile.
5. The only coupling is the HTTP contract described below.

Neither application changes how the other is built, installed or run.

---

## Running the backend

Requires Python 3.10+ and a Groq API key.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then put your real key in GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

The server refuses to start without `GROQ_API_KEY`. API docs are at `http://localhost:8000/docs`, and
`GET /health` returns `{"status": "ok"}`. `/health` only proves the server is up; it does not test the key or
the model.

| Variable       | Required | Purpose                                                                                   |
| -------------- | -------- | ----------------------------------------------------------------------------------------- |
| `GROQ_API_KEY` | yes      | Groq credential, read from `backend/.env`. Never commit it.                               |
| `CORS_ORIGINS` | no       | Comma-separated browser origins allowed to call the API. Defaults to the Vite dev (5173) and preview (4173) ports on `localhost` and `127.0.0.1`. Add your deployed frontend origin in production. |
| `GROQ_MODEL`   | no       | Overrides the default `qwen/qwen3.8-27b`. Groq lists that model as a *preview*, so it can be changed or withdrawn at short notice; set this if it is retired. The model must accept image input and JSON mode. |

### Backend tests

```bash
cd backend
pip install -r requirements-dev.txt   # adds pytest and httpx
pytest
```

`tests/test_image_validation.py` and `tests/test_ai_response.py` need only Pillow and pydantic. `tests/test_api.py`
exercises the HTTP endpoint against a **fake** AI provider, so it proves the contract and error handling but
not that the real model works. To test the real provider, use the `curl` check under *Verifying the real AI request*.

## Running the frontend

```bash
cd frontend
npm install
cp .env.example .env.local         # optional; sets VITE_API_URL
npm run dev                        # http://localhost:5173
```

`VITE_API_URL` is the backend base URL (defaults to `http://localhost:8000`). If Vite starts on another port
(for example because 5173 is busy), add that origin to `CORS_ORIGINS` and restart the backend. Full details,
including production builds and Vercel deployment, are in [`frontend/README.md`](frontend/README.md).

---

## The integration contract

Verified against `backend/main.py`. The backend is the source of truth.

### Request

```
POST /analyze
Content-Type: multipart/form-data
```

| Field                | Type   | Required | Notes                                                                                   |
| -------------------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| `file`               | File   | yes      | JPEG, PNG or WEBP, maximum 8 MB. The backend checks the real image content, not the name. |
| `location`           | string | no       | Defaults to `"Not provided"`. The backend reads at most 500 characters and echoes it back. |
| `additional_details` | string | no       | The backend reads at most 1500 characters.                                              |

The frontend never sets `Content-Type` itself, so the browser generates the multipart boundary.

The backend has **no** field for an issue category or coordinates, and FastAPI silently ignores unknown form
fields. So the frontend does not send them as separate fields. Instead:

- the category a citizen chose (never "let AI identify") and their answers to the follow-up questions are added
  as plain text lines after their own notes in `additional_details`;
- captured GPS coordinates are sent only when no address was typed, as `GPS coordinates <lat>, <lng>` in
  `location`; otherwise they stay in the browser.

### Response (HTTP 200)

```json
{
  "issue_type": "string",
  "is_civic_issue": true,
  "confidence": 0.0,
  "severity": "Low | Medium | High | Critical | Uncertain",
  "description": "string",
  "observations": ["string"],
  "safety_concerns": ["string"],
  "suggested_department": "string",
  "recommended_actions": ["string"],
  "resources": [{ "item": "string", "purpose": "string" }],
  "estimated_cost_inr": { "minimum": null, "maximum": null, "basis": "string" },
  "estimated_duration_hours": { "minimum": null, "maximum": null, "basis": "string" },
  "needs_site_inspection": true,
  "missing_information": ["string"],
  "location": "echo of the submitted location",
  "model": "qwen/qwen3.8-27b",
  "estimate_status": "preliminary",
  "authority_status": "not_submitted"
}
```

The first fourteen keys come from the AI and are validated by the backend (`confidence` between 0 and 1, cost
and duration minimum not above maximum). `location`, `model`, `estimate_status` and `authority_status` are set
by the backend itself. Cost and duration minimum/maximum may be `null`, and the frontend shows them as "Not
available", never as zero.

### Errors

The backend returns `{"detail": "..."}` and the frontend shows that message.

| Status | Cause                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------ |
| 400    | Empty file, or the file could not be read as an image.                                                 |
| 413    | Image larger than 8 MB, or declaring more than 50 megapixels (decompression-bomb protection).         |
| 415    | A readable image that is not JPEG, PNG or WEBP.                                                        |
| 422    | Request is missing `file`.                                                                             |
| 429    | The AI provider is rate limiting requests. Retry shortly.                                              |
| 502    | The AI call failed or was rejected, returned nothing, was cut off, or returned an invalid analysis.    |
| 503    | The AI provider could not be reached.                                                                  |
| 504    | The AI provider timed out.                                                                             |

Provider details (including any key) are written to the server log only, with the API key scrubbed; the client
sees a generic message.

### Verifying the real AI request

Automated tests never call Groq. To check that the real model accepts the request and returns a valid analysis,
start the backend with a real key (see above), then from another terminal run this with any small photo of a
public-infrastructure problem (the key stays in `backend/.env`; it is not needed in the command):

```bash
curl -sS -X POST http://localhost:8000/analyze \
  -F "file=@/path/to/photo.jpg;type=image/jpeg" \
  -F "location=Test street, Test city" \
  -F "additional_details=Smoke test" | python -m json.tool
```

A passing result is HTTP 200 with all keys listed under *Response*. A 502 whose server log mentions
`finish_reason=length` means the model used up `max_completion_tokens`; a 502 or 400 mentioning
`reasoning_format` means the model needs that parameter, see the Groq reasoning docs.

### Analysis is not storage

`POST /analyze` produces an assessment. It does **not** save a report, and it does **not** submit anything to a
government authority (`authority_status` is always `not_submitted`). Report persistence, report history,
jurisdiction routing, authority submission, mapping and authentication do not exist yet and remain placeholders
on the frontend.

---

## Environment and security

- Frontend configuration uses `VITE_`-prefixed variables, which Vite inlines into the browser bundle and are
  therefore **public**. Only the backend base URL belongs there.
- The Groq API key belongs exclusively to the backend environment (`backend/.env`). It must never appear in
  `frontend/`, in a `VITE_` variable, or in source control.
- Real `.env` files are git-ignored; `.env.example` files document the expected variables.
- **Where your data goes:** the photograph, the location text and the details are sent to the CivicFix backend,
  which forwards them to the Groq API to produce the assessment. The backend does not store them. The frontend
  keeps the result in memory for the current tab only.
- CORS is restricted to the origins in `CORS_ORIGINS`. Do not use `*`.

---

## Status

| Area                                          | State                                                         |
| --------------------------------------------- | ------------------------------------------------------------- |
| Frontend interface (pages, form, dashboard)   | Implemented                                                   |
| Frontend ↔ backend integration (`/analyze`)   | Implemented against the real contract                         |
| AI analysis (`POST /analyze`)                 | Implemented; needs a valid `GROQ_API_KEY` to run              |
| Report persistence / history                  | Placeholder (dashboard shows labelled demo data only)         |
| Authority submission, jurisdiction routing     | Placeholder                                                   |
| Incident map, authentication, admin workflows  | Placeholder                                                   |

No municipal or government integration, endorsement or partnership exists. No complaint is submitted to
any authority by this software.

## Local demo on Windows (PowerShell)

Needs Python 3.10+ and Node.js. No database or Docker. Use two terminals.

**Terminal 1 - backend** (from the project folder):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env      # replace your_groq_api_key_here with your key, save
uvicorn main:app --port 8000
```

Check http://localhost:8000/health shows `{"status":"ok"}`.

**Terminal 2 - frontend**:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # VITE_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173, go to **Report an Issue**, upload a JPEG/PNG/WEBP, enter a location and click **Analyse issue**.

If answers fail with "cut off", add `GROQ_REASONING_EFFORT=none` to `backend/.env` and restart the backend.

Status of testing: backend tests and the browser flow were run against a fake Groq server on Linux. A real Groq request and this Windows procedure have not been tested; do one dry run before presenting.


---

## Saved reports (Supabase) and the Issue Map

### 1. Create the database table
1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste the contents of [`backend/supabase_setup.sql`](backend/supabase_setup.sql) and click **Run**.
3. Open **Project Settings → API** and copy the **Project URL** and the **secret key** (`sb_secret_…`, or the legacy `service_role` key). Do **not** use the publishable/anon key.

### 2. Backend environment (`backend/.env`, never committed)
```
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key_here
```
The secret key is read only by the FastAPI backend. The frontend only needs `VITE_API_URL` (a URL, not a secret). The table has row-level security enabled with no policies, so the public anon key cannot read or write it.

### 3. Run it (Windows PowerShell)
```powershell
# Terminal 1 — backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env      # then edit .env and add your real keys
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install                       # installs leaflet and react-leaflet (updates package-lock.json)
Copy-Item .env.example .env.local
npm run dev                       # http://localhost:5173
```
If script activation is blocked: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

Tests and checks:
```powershell
cd backend;  pip install -r requirements-dev.txt; pytest
cd ..\frontend; npm run lint; npm run build
```

### 4. How it works
- **Save:** after an analysis, press **Save report** on the results page. The browser sends JSON to `POST /reports`; the backend validates it and inserts it into Supabase. Each analysis has a `client_request_id`; the table's UNIQUE constraint means double clicks and retries save one report only.
- **Retrieve:** `GET /reports` (filters: `category`, `severity`, `status`, `has_coordinates=true`, `limit`) and `GET /reports/{id}`. Reports survive restarts because they live in Supabase.
- **Map:** `/map` plots saved reports that have coordinates on OpenStreetMap (Leaflet). Choose coordinates on the report form by clicking the map or using **Use My Location**. Reports without coordinates are saved but never plotted; nothing is invented.
- **Status:** new reports start as `Open`. There are no accounts, so to demo `Resolved` edit the `status` column in Supabase's Table Editor.
- Photographs are not stored (only the assessment data).
