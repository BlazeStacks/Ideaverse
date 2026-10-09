"""Request validation for saving a report (POST /reports)."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

Severity = Literal["Low", "Medium", "High", "Critical", "Uncertain"]
Status = Literal["Open", "In Review", "In Progress", "Resolved", "Closed"]


class ReportCreate(BaseModel):
    client_request_id: UUID
    issue_category: str = Field(min_length=1, max_length=120)
    issue_type: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    recommended_actions: list[str] = Field(default_factory=list, max_length=30)
    suggested_department: str | None = Field(default=None, max_length=300)
    estimated_cost_min: float | None = Field(default=None, ge=0)
    estimated_cost_max: float | None = Field(default=None, ge=0)
    estimated_cost_basis: str | None = Field(default=None, max_length=2000)
    estimated_duration_min_hours: float | None = Field(default=None, ge=0)
    estimated_duration_max_hours: float | None = Field(default=None, ge=0)
    estimated_duration_basis: str | None = Field(default=None, max_length=2000)
    location: str = Field(default="", max_length=500)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("recommended_actions")
    @classmethod
    def _clean_actions(cls, value: list[str]) -> list[str]:
        return [item.strip()[:1000] for item in value if isinstance(item, str) and item.strip()]

    @model_validator(mode="after")
    def _check(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        for low, high, name in (
            (self.estimated_cost_min, self.estimated_cost_max, "cost"),
            (self.estimated_duration_min_hours, self.estimated_duration_max_hours, "duration"),
        ):
            if low is not None and high is not None and low > high:
                raise ValueError(f"Minimum {name} exceeds maximum {name}")
        return self

    def to_row(self) -> dict:
        # `status` is not accepted from clients: the database default ("Open")
        # applies to every new report.
        return self.model_dump(mode="json")
