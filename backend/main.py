
import base64
import logging
import os
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from groq import AsyncGroq

from ai_response import AnalysisFailure, parse_analysis, translate_provider_error
from image_validation import ImageRejected, validate_image_bytes
from report_schemas import ReportCreate, Severity, Status
from reports_store import ReportStore, StoreUnavailable
from request_guard import GuardRejected, RequestGuard

load_dotenv()

logger = logging.getLogger("civicfix")

API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing from your .env file")

# Bounded so a stalled provider cannot hold a request open much longer than the
# frontend's 90 second timeout: one attempt plus one retry at 40 s each.
client = AsyncGroq(api_key=API_KEY, timeout=40.0, max_retries=1)

# Groq lists this as a *preview* model: it may change or be withdrawn at short
# notice. Override with GROQ_MODEL if Groq retires it.
MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")


def _env_int(name: str, default: int, minimum: int = 1) -> int:
    """Read a positive integer setting; fall back to the default if invalid."""
    try:
        return max(minimum, int(os.getenv(name, default)))
    except ValueError:
        logger.warning("Ignoring invalid %s; using %s", name, default)
        return default


# qwen/qwen3.8-27b starts in "thinking" mode by default, and thinking tokens
# count towards this limit. Groq lists 16,384 as the model's maximum output. If
# an answer is still cut off the API returns an honest 502 (never a guess); set
# GROQ_REASONING_EFFORT=none in backend/.env to switch to the faster,
# non-thinking "instruct" mode described on the model's Groq page.
MAX_COMPLETION_TOKENS = _env_int("GROQ_MAX_COMPLETION_TOKENS", 6000, minimum=500)
REASONING_EFFORT = os.getenv("GROQ_REASONING_EFFORT", "").strip().lower() or None
VALID_REASONING_EFFORTS = {"none", "default", "low", "medium", "high"}
if REASONING_EFFORT and REASONING_EFFORT not in VALID_REASONING_EFFORTS:
    logger.warning("Ignoring invalid GROQ_REASONING_EFFORT=%r", REASONING_EFFORT)
    REASONING_EFFORT = None

# Basic demo-grade limits (in memory, single process). See request_guard.py.
guard = RequestGuard(
    max_concurrent=_env_int("MAX_CONCURRENT_ANALYSES", 2),
    max_requests=_env_int("RATE_LIMIT_PER_MINUTE", 10),
    window_seconds=60.0,
)

# Supabase persistence. Optional at start-up so /analyze keeps working without
# it; the /reports endpoints answer 503 with a clear message until configured.
# SUPABASE_SECRET_KEY is a server-side secret: it lives in backend/.env only.
store = ReportStore(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SECRET_KEY"))
if not store.configured:
    logger.warning("SUPABASE_URL / SUPABASE_SECRET_KEY not set: saving reports is disabled")

app = FastAPI(
    title="CivicFix AI",
    description="AI-powered civic issue analysis and repair planning",
    version="0.1.0",
)

# CORS: only the listed frontend origins may call this API from a browser.
# Configure with CORS_ORIGINS (comma-separated, no trailing slashes). The
# default covers the Vite dev server (5173) and `vite preview` (4173). Add the
# deployed frontend origin here when deploying.
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:4173,http://127.0.0.1:4173"
)
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 8 * 1024 * 1024  # 8 MB

SYSTEM_PROMPT = """
You are the visual assessment and preliminary repair-planning
assistant for CivicFix AI, a civic infrastructure reporting system.

Analyze the submitted photograph and optional location/user description.

Supported examples include:
- Potholes and damaged roads
- Drainage blockages and overflow
- Visible water pipeline leaks
- Damaged or apparently unlit traffic signals
- Garbage accumulation
- Damaged footpaths and other visible public infrastructure issues

Return one valid JSON object with these keys:

{
  "issue_type": "short category",
  "is_civic_issue": true,
  "confidence": 0.0,
  "severity": "Low | Medium | High | Critical | Uncertain",
  "description": "Concise description of visible evidence",
  "observations": ["visible observation"],
  "safety_concerns": ["potential concern"],
  "suggested_department": "responsible department",
  "recommended_actions": ["practical preliminary action"],
  "resources": [
    {
      "item": "resource or material",
      "purpose": "why it may be needed"
    }
  ],
  "estimated_cost_inr": {
    "minimum": null,
    "maximum": null,
    "basis": "assumptions and limitations"
  },
  "estimated_duration_hours": {
    "minimum": null,
    "maximum": null,
    "basis": "assumptions and limitations"
  },
  "needs_site_inspection": true,
  "missing_information": ["information needed for a reliable estimate"]
}

Rules:
1. Describe only what the image supports. Do not invent hidden damage.
2. confidence must be a number between 0 and 1, not a guarantee
   of correctness.
3. Assess severity based on visible extent, public impact, safety risk, and available evidence.

* Low: Minor issue with limited impact and no significant immediate safety risk.
* Medium: Noticeable issue requiring attention, with a meaningful impact on public infrastructure or daily activities.
* High: Serious issue causing substantial disruption, significant damage, or a credible risk to public safety.
* Critical: Exceptional case involving a clear, immediate, serious threat requiring urgent intervention. Use sparingly.
* Uncertain: Insufficient evidence to assess severity reliably.

Rules:

* Judge the actual condition and impact, not just the issue category or appearance.
* Do not exaggerate risks or assume hidden damage.
* Distinguish observed facts from potential hazards.
* If key information is missing, use Uncertain when appropriate.
* Ensure severity matches the observations and safety concerns.

4. Do not infer that a traffic signal is electrically faulty from
   a still image alone. State that testing is needed.
5. Do not invent precise measurements, material quantities,
   contractor prices, or repair durations.
6. Cost and duration are preliminary estimates, not quotations.
   If the image and supplied context do not support a defensible
   range, set minimum and maximum to null and explain why.
7. If an estimate is possible, use a broad indicative range and
   state the assumptions. Do not present it as an official rate.
8. Recommend inspection by qualified personnel when required.
9. Do not claim a report has been sent to any authority.
10. If the photo does not show a civic issue, set is_civic_issue
    to false, severity to Uncertain, and explain the limitation.
11. Return JSON only, with no Markdown fences.
"""


@app.get("/")
async def root():
    return {
        "project": "CivicFix AI",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_image(
    request: Request,
    file: UploadFile = File(...),
    location: str = Form(default="Not provided"),
    additional_details: str = Form(default=""),
):
    client_id = request.client.host if request.client else "unknown"
    try:
        guard.acquire(client_id)
    except GuardRejected as rejected:
        headers = (
            {"Retry-After": str(rejected.retry_after)} if rejected.retry_after else None
        )
        raise HTTPException(
            status_code=rejected.status_code, detail=rejected.detail, headers=headers
        )

    try:
        return await _analyze(file, location, additional_details)
    finally:
        guard.release()


async def _analyze(file: UploadFile, location: str, additional_details: str) -> dict:
    # Validate file size before processing.
    image_bytes = await file.read(MAX_FILE_SIZE + 1)

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image must be 8 MB or smaller",
        )

    # Validate the actual image content, format and declared dimensions (this
    # also rejects decompression bombs before any pixel data is decoded).
    try:
        mime_type = validate_image_bytes(image_bytes)
    except ImageRejected as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    image_url = f"data:{mime_type};base64,{encoded_image}"

    user_prompt = f"""
    Analyze this civic issue photograph.

    Reported location: {location[:500]}
    Additional details from citizen: {additional_details[:1500]}

    Distinguish visual evidence from assumptions.
    Suggest an appropriate preliminary repair approach,
    potential resources, and defensible cost/time ranges.
    Return every key specified in the system instructions.
    """

    completion_options = {"max_completion_tokens": MAX_COMPLETION_TOKENS}
    if REASONING_EFFORT:
        completion_options["reasoning_effort"] = REASONING_EFFORT

    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                    ],
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            **completion_options,
        )

        result = parse_analysis(response)

    except AnalysisFailure as failure:
        logger.error(failure.log)
        raise HTTPException(status_code=failure.status_code, detail=failure.detail)

    except Exception as exc:
        # Provider/SDK failure. Technical details go to the server log (with the
        # API key scrubbed), never to the client.
        failure = translate_provider_error(exc, secret=API_KEY)
        logger.error(failure.log)
        raise HTTPException(status_code=failure.status_code, detail=failure.detail)

    # Attach application-generated metadata.
    result["location"] = location
    result["model"] = MODEL
    result["estimate_status"] = "preliminary"
    result["authority_status"] = "not_submitted"

    return result


# ---------------------------------------------------------------------------
# Saved reports (Supabase)
# ---------------------------------------------------------------------------


@app.post("/reports", status_code=201)
async def create_report(report: ReportCreate, response: Response):
    """Save a report permanently. A repeated client_request_id returns the
    already-saved report (HTTP 200) instead of creating a duplicate."""
    try:
        saved, created = await store.create(report.to_row())
    except StoreUnavailable as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    if not created:
        response.status_code = 200
    return {"report": saved, "created": created}


@app.get("/reports")
async def list_reports(
    category: str | None = Query(default=None, max_length=120),
    severity: Severity | None = None,
    status: Status | None = None,
    has_coordinates: bool = False,
    limit: int = Query(default=500, ge=1, le=1000),
):
    """Saved reports, newest first. ``has_coordinates=true`` returns only
    reports that can be placed on the map."""
    try:
        rows = await store.list(
            category=category,
            severity=severity,
            status=status,
            has_coordinates=has_coordinates,
            limit=limit,
        )
    except StoreUnavailable as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    return {"reports": rows, "count": len(rows)}


@app.get("/reports/{report_id}")
async def get_report(report_id: UUID):
    try:
        row = await store.get(str(report_id))
    except StoreUnavailable as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return row
