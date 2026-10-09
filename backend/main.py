
import os
import json
import base64
from io import BytesIO
from typing import Literal
from pydantic import BaseModel, Field, model_validator

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import AsyncGroq
from PIL import Image, UnidentifiedImageError

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing from your .env file")

client = AsyncGroq(api_key=API_KEY)

MODEL = "qwen/qwen3.8-27b"

class CostEstimate(BaseModel):
    minimum: float | None = Field(default=None, ge=0)
    maximum: float | None = Field(default=None, ge=0)
    basis: str

    @model_validator(mode="after")
    def validate_range(self):
        if (
            self.minimum is not None
            and self.maximum is not None
            and self.minimum > self.maximum
        ):
            raise ValueError("Minimum cost exceeds maximum cost")
        return self


class DurationEstimate(BaseModel):
    minimum: float | None = Field(default=None, ge=0)
    maximum: float | None = Field(default=None, ge=0)
    basis: str

    @model_validator(mode="after")
    def validate_range(self):
        if (
            self.minimum is not None
            and self.maximum is not None
            and self.minimum > self.maximum
        ):
            raise ValueError("Minimum duration exceeds maximum duration")
        return self


class Resource(BaseModel):
    item: str
    purpose: str


class CivicAnalysis(BaseModel):
    issue_type: str
    is_civic_issue: bool
    confidence: float = Field(ge=0, le=1)
    severity: Literal[
        "Low", "Medium", "High", "Critical", "Uncertain"
    ]
    description: str
    observations: list[str]
    safety_concerns: list[str]
    suggested_department: str
    recommended_actions: list[str]
    resources: list[Resource]
    estimated_cost_inr: CostEstimate
    estimated_duration_hours: DurationEstimate
    needs_site_inspection: bool
    missing_information: list[str]

app = FastAPI(
    title="CivicFix AI",
    description="AI-powered civic issue analysis and repair planning",
    version="0.1.0",
)

# Development setup. Restrict origins before production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
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
    file: UploadFile = File(...),
    location: str = Form(default="Not provided"),
    additional_details: str = Form(default=""),
):
    # Validate file size before processing.
    image_bytes = await file.read(MAX_FILE_SIZE + 1)

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image must be 8 MB or smaller",
        )

    # Validate the actual image, not just its filename or MIME type.
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            image_format = image.format
            image.verify()

        mime_types = {
            "JPEG": "image/jpeg",
            "PNG": "image/png",
            "WEBP": "image/webp",
        }

        if image_format not in mime_types:
            raise HTTPException(
                status_code=415,
                detail="Upload a JPEG, PNG, or WEBP image",
            )

        mime_type = mime_types[image_format]

    except UnidentifiedImageError as exc:
        print(f"Image error: {repr(exc)}")
        raise HTTPException(
            status_code=400,
            detail=f"Image could not be identified: {str(exc)}",
        )

    except OSError:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image could not be read",
        )

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
            max_completion_tokens=1800,
        )

        content = response.choices[0].message.content

        if not content:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response",
            )
        
        try:
            result = CivicAnalysis.model_validate(
                json.loads(content)
            ).model_dump()

        except (json.JSONDecodeError, ValueError) as exc:
            print(f"Invalid AI response: {exc}")
            raise HTTPException(
                status_code=502,
                detail="The AI returned an invalid analysis. Please retry.",
            )

    except HTTPException:
        raise

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="The AI response was not valid JSON. Try again.",
        )

    except Exception as exc:
        # Log technical details in the server terminal, not to the user.
        print(f"Groq API error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail=(
                "Image analysis failed. Check the API key, model access, "
                "network connection, and API rate limits."
            ),
        )

    # Attach application-generated metadata.
    result["location"] = location
    result["model"] = MODEL
    result["estimate_status"] = "preliminary"
    result["authority_status"] = "not_submitted"

    return result