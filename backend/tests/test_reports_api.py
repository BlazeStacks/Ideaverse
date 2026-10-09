"""HTTP tests for the stored-report endpoints (/reports and friends).

The store is replaced through FastAPI's ``dependency_overrides``, so these tests
prove the API contract — validation, idempotency, filtering, projections, error
statuses — against the real ``ReportRepository`` policy. Supabase itself is not
contacted: no credentials exist in the test environment, and one test asserts
exactly that, because "storage not configured" must never look like success.
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

pytest.importorskip("fastapi")
pytest.importorskip("httpx")
pytest.importorskip("groq")

os.environ.setdefault("GROQ_API_KEY", "test-key-not-real")

from fastapi.testclient import TestClient  # noqa: E402

import db  # noqa: E402
import main  # noqa: E402
from report_store import InMemoryReportStore, get_report_store  # noqa: E402
from test_api import FakeProvider, image_bytes  # noqa: E402


def report_payload(**overrides) -> dict:
    payload = {
        "client_report_id": "session-11111111-2222",
        "issue_category": "road-damage",
        "issue_category_label": "Road Damage",
        "issue_type": "Pothole",
        "description": "The photograph appears to show a damaged road surface.",
        "severity": "High",
        "confidence": 0.91,
        "is_civic_issue": True,
        "observations": ["Broken asphalt at the left edge"],
        "safety_concerns": ["Vehicles swerving around the damage"],
        "recommended_actions": ["Inspect and repair the surface"],
        "resources": [{"item": "Cold mix asphalt", "purpose": "temporary patching"}],
        "missing_information": ["Depth of the damage"],
        "suggested_department": "Road maintenance",
        "needs_site_inspection": True,
        "estimated_cost_min": 4000,
        "estimated_cost_max": 9000,
        "estimated_cost_basis": "Indicative rate for a small patch repair.",
        "estimated_duration_min": 3,
        "estimated_duration_max": 8,
        "estimated_duration_basis": "Assumes daytime access to the carriageway.",
        "location": "Karve Road, Pune",
        "landmark": "Opposite the bus depot gate",
        "latitude": 18.50123,
        "longitude": 73.81234,
        "location_accuracy_m": 24,
        "status": "draft",
        "complaint_subject": "Request for Inspection and Repair of Damaged Road",
        "complaint_body": "Respected Sir/Madam, ...",
        "image_name": "pothole.jpg",
        "image_size_bytes": 240000,
        "image_sha256": "a" * 64,
        "analysis_model": "qwen/qwen3.8-27b",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def store() -> InMemoryReportStore:
    return InMemoryReportStore()


@pytest.fixture
def api(store) -> TestClient:
    main.app.dependency_overrides[get_report_store] = lambda: store
    try:
        yield TestClient(main.app)
    finally:
        main.app.dependency_overrides.clear()


@pytest.fixture
def unconfigured(monkeypatch):
    """Simulate a server with no Supabase credentials at all."""
    monkeypatch.setattr(db, "is_configured", lambda: False)


# --------------------------------------------------------------------------- #
# Storage must be explicit                                                     #
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("post", "/reports"),
        ("get", "/reports"),
        ("get", "/reports/stats"),
        ("get", "/reports/map"),
        ("get", f"/reports/{uuid.uuid4()}"),
        ("patch", f"/reports/{uuid.uuid4()}/status"),
    ],
)
def test_endpoints_explain_that_storage_is_not_configured(monkeypatch, unconfigured, method, path):
    client = TestClient(main.app)
    kwargs = {"json": report_payload()} if method == "post" else {}
    if method == "patch":
        kwargs = {"json": {"status": "resolved"}}

    response = getattr(client, method)(path, **kwargs)

    assert response.status_code == 503
    assert "SUPABASE_URL" in response.json()["detail"]


def test_health_still_reports_ok_and_describes_storage(monkeypatch, unconfigured):
    response = TestClient(main.app).get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok", "analysis must keep working without a database"
    assert body["storage"]["configured"] is False
    assert "SUPABASE_URL" in body["storage"]["detail"]


def test_health_never_leaks_the_key(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://demo-project.supabase.co")
    monkeypatch.setenv("SUPABASE_KEY", "super-secret-service-role-key")

    body = TestClient(main.app).get("/health").json()

    assert body["storage"]["configured"] is True
    assert body["storage"]["url_host"] == "demo-project.supabase.co"
    assert "super-secret-service-role-key" not in str(body)
    assert "demo-project.supabase.co" in body["storage"]["detail"]


# --------------------------------------------------------------------------- #
# Saving                                                                       #
# --------------------------------------------------------------------------- #


def test_save_stores_a_complete_report(api, store):
    response = api.post("/reports", json=report_payload())

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["duplicate"] is False

    row = body["report"]
    assert uuid.UUID(row["id"])
    assert row["severity"] == "High"
    assert row["confidence"] == pytest.approx(0.91)
    assert row["latitude"] == pytest.approx(18.50123)
    assert row["longitude"] == pytest.approx(73.81234)
    assert row["status"] == "draft"
    assert row["created_at"]
    assert row["recommended_actions"] == ["Inspect and repair the surface"]
    assert row["estimated_cost_min"] == pytest.approx(4000)
    assert row["estimated_duration_unit"] == "hours"
    assert row["complaint_subject"].startswith("Request for Inspection")
    assert row["fingerprint"]
    assert len(store.list()) == 1


def test_repeated_save_returns_the_stored_row(api, store):
    first = api.post("/reports", json=report_payload()).json()["report"]

    second = api.post("/reports", json=report_payload(description="Slightly different wording"))

    assert second.status_code == 200, "a repeat must not look like a failure"
    body = second.json()
    assert body["duplicate"] is True
    assert body["report"]["id"] == first["id"]
    assert body["report"]["description"] == first["description"]
    assert len(store.list()) == 1


def test_save_accepts_a_report_without_coordinates(api):
    response = api.post(
        "/reports",
        json=report_payload(latitude=None, longitude=None, location="Near the vegetable market"),
    )

    assert response.status_code == 201
    assert response.json()["report"]["latitude"] is None


def test_save_accepts_a_report_without_estimates(api):
    response = api.post(
        "/reports",
        json=report_payload(
            estimated_cost_min=None,
            estimated_cost_max=None,
            estimated_cost_basis=None,
            estimated_duration_min=None,
            estimated_duration_max=None,
            confidence=None,
            severity=None,
        ),
    )

    assert response.status_code == 201
    row = response.json()["report"]
    assert row["estimated_cost_min"] is None
    assert row["confidence"] is None
    assert row["severity"] is None, "a missing severity is stored as null, never as 0 or 'Uncertain'"


@pytest.mark.parametrize(
    ("override", "reason"),
    [
        ({"client_report_id": ""}, "the idempotency key is required"),
        ({"latitude": 19.0, "longitude": None}, "half a coordinate pair"),
        ({"latitude": 200.0, "longitude": 73.0}, "out of range latitude"),
        ({"location": None, "landmark": None, "latitude": None, "longitude": None}, "no location at all"),
        ({"confidence": 1.4}, "confidence above 1"),
        ({"estimated_cost_min": 9000, "estimated_cost_max": 1000}, "inverted cost range"),
        ({"status": "acknowledged_by_government"}, "a status CivicFix cannot verify"),
        ({"severity": "Extreme"}, "an unknown severity"),
    ],
)
def test_invalid_reports_are_rejected(api, store, override, reason):
    response = api.post("/reports", json=report_payload(**override))

    assert response.status_code == 422, reason
    assert len(store.list()) == 0


def test_blank_strings_are_stored_as_null(api):
    row = api.post(
        "/reports",
        json=report_payload(description="   ", issue_category_label="", landmark=""),
    ).json()["report"]

    assert row["description"] is None
    assert row["issue_category_label"] is None
    assert row["landmark"] is None


# --------------------------------------------------------------------------- #
# Reading                                                                      #
# --------------------------------------------------------------------------- #


def test_list_returns_newest_first_and_filters(api):
    older = api.post("/reports", json=report_payload(client_report_id="session-older-000001")).json()["report"]
    api.post(
        "/reports",
        json=report_payload(
            client_report_id="session-newer-000002",
            image_sha256="b" * 64,
            issue_category="waste-management",
            severity="Low",
            status="ready_to_submit",
            latitude=None,
            longitude=None,
        ),
    )

    listed = api.get("/reports").json()
    assert listed["count"] == 2
    assert [row["id"] for row in listed["reports"]][-1] == older["id"], "newest first"

    assert api.get("/reports", params={"category": "waste-management"}).json()["count"] == 1
    assert api.get("/reports", params={"severity": "Low"}).json()["count"] == 1
    assert api.get("/reports", params={"status": "ready_to_submit"}).json()["count"] == 1
    assert api.get("/reports", params={"located": "true"}).json()["count"] == 1
    assert api.get("/reports", params={"limit": 1}).json()["count"] == 1


@pytest.mark.parametrize("params", [{"severity": "Extreme"}, {"status": "resolved_by_ai"}])
def test_list_rejects_unknown_filter_values(api, params):
    response = api.get("/reports", params=params)

    assert response.status_code == 400
    assert "Allowed values" in response.json()["detail"]


def test_map_returns_only_reports_with_coordinates(api):
    api.post("/reports", json=report_payload(client_report_id="session-mapped-000001"))
    api.post(
        "/reports",
        json=report_payload(client_report_id="session-unmapped-002", image_sha256="c" * 64, latitude=None, longitude=None),
    )

    body = api.get("/reports/map").json()

    assert body["count"] == 1
    point = body["reports"][0]
    assert point["latitude"] == pytest.approx(18.50123)
    assert point["issue_type"] == "Pothole"
    assert point["severity"] == "High"
    assert point["status"] == "draft"
    assert "complaint_body" not in point, "the map projection stays small"


def test_stats_counts_high_severity_and_resolved(api):
    first = api.post("/reports", json=report_payload(client_report_id="session-stats-000001", severity="Critical")).json()["report"]
    api.post(
        "/reports",
        json=report_payload(client_report_id="session-stats-000002", image_sha256="d" * 64, severity="Low", latitude=None, longitude=None),
    )
    api.patch(f"/reports/{first['id']}/status", json={"status": "resolved"})

    stats = api.get("/reports/stats").json()

    assert stats["total"] == 2
    assert stats["high_severity"] == 1
    assert stats["resolved"] == 1
    assert stats["with_coordinates"] == 1
    assert stats["by_status"]["resolved"] == 1


def test_get_by_id_and_not_found(api):
    saved = api.post("/reports", json=report_payload()).json()["report"]

    assert api.get(f"/reports/{saved['id']}").json()["report"]["id"] == saved["id"]
    assert api.get(f"/reports/{uuid.uuid4()}").status_code == 404
    assert api.get("/reports/not-a-uuid").status_code == 400


def test_status_can_be_updated_but_only_to_known_values(api):
    saved = api.post("/reports", json=report_payload()).json()["report"]

    updated = api.patch(f"/reports/{saved['id']}/status", json={"status": "ready_to_submit"})

    assert updated.status_code == 200
    assert updated.json()["report"]["status"] == "ready_to_submit"
    assert updated.json()["report"]["status_updated_at"]
    assert api.get("/reports", params={"status": "ready_to_submit"}).json()["count"] == 1

    rejected = api.patch(f"/reports/{saved['id']}/status", json={"status": "fixed_by_municipality"})
    assert rejected.status_code == 422
    assert api.get("/reports", params={"status": "ready_to_submit"}).json()["count"] == 1


def test_status_update_on_a_missing_report(api):
    response = api.patch(f"/reports/{uuid.uuid4()}/status", json={"status": "resolved"})

    assert response.status_code == 404


# --------------------------------------------------------------------------- #
# Analysis must never write                                                    #
# --------------------------------------------------------------------------- #


def test_analyze_does_not_store_anything(monkeypatch, store):
    """An assessment is not a stored report: only POST /reports writes a row."""
    from request_guard import RequestGuard

    monkeypatch.setattr(main, "guard", RequestGuard(max_concurrent=2, max_requests=100))
    monkeypatch.setattr(main, "client", FakeProvider())
    main.app.dependency_overrides[get_report_store] = lambda: store
    try:
        client = TestClient(main.app)
        response = client.post(
            "/analyze",
            files={"file": ("issue.png", image_bytes(), "image/png")},
            data={"location": "Karve Road", "additional_details": ""},
        )

        assert response.status_code == 200
        assert response.json()["authority_status"] == "not_submitted"
        assert len(store.list()) == 0, "an analysis is not a stored report until the citizen saves it"
    finally:
        main.app.dependency_overrides.clear()
