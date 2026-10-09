"""Tests for saved reports: validation, the Supabase store and the HTTP endpoints.

The database is replaced by an in-memory fake (HTTP tests) or by an
``httpx.MockTransport`` (store tests), so no real Supabase project, key or
network access is needed. They prove the app's behaviour, not that a real
Supabase project is configured correctly.
"""

import asyncio
import json
import os
from uuid import uuid4

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")
pytest.importorskip("groq")

os.environ.setdefault("GROQ_API_KEY", "test-key-not-real")

import httpx  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from pydantic import ValidationError  # noqa: E402

import main  # noqa: E402
from report_schemas import ReportCreate  # noqa: E402
from reports_store import ReportStore, StoreUnavailable  # noqa: E402


def payload(**overrides):
    body = {
        "client_request_id": str(uuid4()),
        "issue_category": "Road damage",
        "issue_type": "Pothole",
        "description": "Large pothole near the junction.",
        "severity": "High",
        "confidence": 0.9,
        "recommended_actions": ["Barricade the area", "  ", "Patch the surface"],
        "suggested_department": "Roads department",
        "estimated_cost_min": 1000,
        "estimated_cost_max": 5000,
        "estimated_cost_basis": "Indicative only",
        "estimated_duration_min_hours": 2,
        "estimated_duration_max_hours": 8,
        "estimated_duration_basis": "Indicative only",
        "location": "Karve Road, Pune",
        "latitude": 18.5074,
        "longitude": 73.8077,
    }
    body.update(overrides)
    return body


# --- validation ---------------------------------------------------------


def test_valid_payload_cleans_blank_actions():
    report = ReportCreate(**payload())
    assert report.recommended_actions == ["Barricade the area", "Patch the surface"]


def test_report_without_coordinates_is_valid():
    report = ReportCreate(**payload(latitude=None, longitude=None))
    assert report.latitude is None and report.longitude is None


@pytest.mark.parametrize(
    "overrides",
    [
        {"latitude": 18.5, "longitude": None},
        {"latitude": None, "longitude": 73.8},
        {"latitude": 91, "longitude": 73.8},
        {"latitude": 18.5, "longitude": 181},
        {"severity": "Catastrophic"},
        {"confidence": 1.5},
        {"estimated_cost_min": 10, "estimated_cost_max": 5},
        {"estimated_duration_min_hours": 9, "estimated_duration_max_hours": 1},
        {"client_request_id": "not-a-uuid"},
    ],
)
def test_invalid_payloads_are_rejected(overrides):
    with pytest.raises(ValidationError):
        ReportCreate(**payload(**overrides))


# --- store against a mocked Supabase REST API ----------------------------


def make_store(handler):
    return ReportStore(
        "https://example.supabase.co", "secret", transport=httpx.MockTransport(handler)
    )


def test_store_sends_secret_key_and_ignores_duplicates():
    seen = {}

    def handler(request: httpx.Request):
        seen["headers"] = request.headers
        seen["url"] = str(request.url)
        return httpx.Response(201, json=[{"id": "abc", "issue_type": "Pothole"}])

    saved, created = asyncio.run(make_store(handler).create({"client_request_id": "x"}))
    assert created is True and saved["id"] == "abc"
    assert seen["headers"]["apikey"] == "secret"
    assert "ignore-duplicates" in seen["headers"]["prefer"]
    assert "on_conflict=client_request_id" in seen["url"]


def test_store_returns_existing_report_on_duplicate():
    calls = []

    def handler(request: httpx.Request):
        calls.append(request.method)
        if request.method == "POST":
            return httpx.Response(201, json=[])  # ignored as duplicate
        return httpx.Response(200, json=[{"id": "first"}])

    saved, created = asyncio.run(make_store(handler).create({"client_request_id": "x"}))
    assert created is False and saved["id"] == "first"
    assert calls == ["POST", "GET"]


def test_store_unconfigured_raises_503():
    with pytest.raises(StoreUnavailable) as caught:
        asyncio.run(ReportStore(None, None).list())
    assert caught.value.status_code == 503


def test_store_hides_supabase_error_details():
    def handler(request):
        return httpx.Response(401, json={"message": "Invalid API key sk-secret-123"})

    with pytest.raises(StoreUnavailable) as caught:
        asyncio.run(make_store(handler).list())
    assert "sk-secret-123" not in caught.value.detail


def test_store_network_failure_is_reported_cleanly():
    def handler(request):
        raise httpx.ConnectError("boom")

    with pytest.raises(StoreUnavailable):
        asyncio.run(make_store(handler).list())


def test_store_list_filters_by_coordinates():
    seen = {}

    def handler(request: httpx.Request):
        seen["params"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    asyncio.run(make_store(handler).list(severity="High", has_coordinates=True))
    assert seen["params"]["severity"] == "eq.High"
    assert seen["params"]["latitude"] == "not.is.null"
    assert seen["params"]["longitude"] == "not.is.null"


# --- HTTP endpoints with an in-memory fake store --------------------------


class FakeStore:
    configured = True

    def __init__(self):
        self.rows = []

    async def create(self, row):
        for existing in self.rows:
            if existing["client_request_id"] == row["client_request_id"]:
                return existing, False
        saved = {**row, "id": str(uuid4()), "status": "Open", "created_at": "2026-10-10T00:00:00Z"}
        self.rows.append(saved)
        return saved, True

    async def list(self, *, has_coordinates=None, severity=None, **_):
        rows = self.rows
        if has_coordinates:
            rows = [r for r in rows if r["latitude"] is not None]
        if severity:
            rows = [r for r in rows if r["severity"] == severity]
        return rows

    async def get(self, report_id):
        return next((r for r in self.rows if r["id"] == report_id), None)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(main, "store", FakeStore())
    return TestClient(main.app)


def test_save_then_list_and_get(client):
    body = payload()
    created = client.post("/reports", json=body)
    assert created.status_code == 201
    report = created.json()["report"]
    assert report["status"] == "Open"

    listed = client.get("/reports").json()
    assert listed["count"] == 1
    assert client.get(f"/reports/{report['id']}").json()["issue_type"] == "Pothole"


def test_duplicate_submission_saves_once(client):
    body = payload()
    first = client.post("/reports", json=body)
    second = client.post("/reports", json=body)
    assert first.status_code == 201 and first.json()["created"] is True
    assert second.status_code == 200 and second.json()["created"] is False
    assert second.json()["report"]["id"] == first.json()["report"]["id"]
    assert client.get("/reports").json()["count"] == 1


def test_client_cannot_set_status(client):
    saved = client.post("/reports", json=payload(status="Resolved")).json()["report"]
    assert saved["status"] == "Open"


def test_report_without_coordinates_saved_but_not_mappable(client):
    assert client.post("/reports", json=payload(latitude=None, longitude=None)).status_code == 201
    client.post("/reports", json=payload())
    assert client.get("/reports").json()["count"] == 2
    mappable = client.get("/reports", params={"has_coordinates": "true"}).json()
    assert mappable["count"] == 1 and mappable["reports"][0]["latitude"] is not None


def test_invalid_report_is_422(client):
    assert client.post("/reports", json=payload(latitude=200)).status_code == 422


def test_unknown_report_is_404_and_bad_id_is_422(client):
    assert client.get(f"/reports/{uuid4()}").status_code == 404
    assert client.get("/reports/not-a-uuid").status_code == 422


def test_unconfigured_database_gives_503(monkeypatch):
    monkeypatch.setattr(main, "store", ReportStore(None, None))
    test_client = TestClient(main.app)
    assert test_client.get("/reports").status_code == 503
    assert test_client.post("/reports", json=payload()).status_code == 503
