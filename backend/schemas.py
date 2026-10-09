"""Response schema for POST /analyze.

Kept in its own module (moved unchanged from main.py) so it can be imported and
tested without FastAPI, the Groq SDK or an API key.
"""

from typing import Literal

from pydantic import BaseModel, Field, model_validator


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
    severity: Literal["Low", "Medium", "High", "Critical", "Uncertain"]
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
