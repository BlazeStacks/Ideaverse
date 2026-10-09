"""Unit tests for report persistence policy and the storage adapters.

Two things are proven here:

* the duplicate-prevention rules (``client_report_id`` idempotency, the
  image/location fingerprint window, and the insert race) behave as documented,
  using ``InMemoryReportStore`` — the *same* ``ReportRepository`` production
  uses, so the rules under test are the rules that ship;
* ``SupabaseReportStore`` builds the PostgREST calls the design relies on and
  turns storage failures into safe, explanatory errors, verified against a
  minimal in-process fake of the supabase-py query builder.

These tests do NOT prove that a real Supabase project answers those calls. That
requires credentials and network access, which the suite deliberately does not
have; see README.md → "Verifying report persistence".
"""

from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from report_schemas import ReportCreate  # noqa: E402
from report_store import (  # noqa: E402
    DuplicateReport,
    InMemoryReportStore,
    ReportRepository,
    ReportStoreError,
    SupabaseReportStore,
    report_fingerprint,
)

BASE_DRAFT = {
    "client_report_id": "session-aaaaaaaa-1111",
    "issue_category": "road-damage",
    "issue_category_label": "Road Damage",
    "issue_type": "Pothole",
    "description": "A pothole is visible in the carriageway.",
    "severity": "High",
    "confidence": 0.87,
    "location": "Karve Road, Pune",
    "latitude": 18.50123,
    "longitude": 73.81234,
    "image_name": "pothole.jpg",
    "image_sha256": "a" * 64,
}


def draft(**overrides) -> ReportCreate:
    return ReportCreate(**{**BASE_DRAFT, **overrides})


# --------------------------------------------------------------------------- #
# Fingerprint                                                                  #
# --------------------------------------------------------------------------- #


def test_fingerprint_requires_an_image_hash():
    """Without the photo hash a fingerprint would block genuine repeat reports."""
    assert report_fingerprint(image_sha256=None, location="A road", issue_type="Pothole", issue_category="road-damage") is None


def test_fingerprint_is_stable_and_input_sensitive():
    base = dict(image_sha256="b" * 64, location="  Karve   Road , Pune ", issue_type="Pothole", issue_category="road-damage")
    same = dict(image_sha256="b" * 64, location="karve road , pune", issue_type="pothole", issue_category="Road-Damage")

    first = report_fingerprint(**base)
    assert first == report_fingerprint(**same), "whitespace and case must not change the fingerprint"
    assert report_fingerprint(**{**base, "image_sha256": "c" * 64}) != first, "a different photo is a different report"
    assert report_fingerprint(**{**base, "location": "Old Mumbai Road"}) != first


# --------------------------------------------------------------------------- #
# Repository policy                                                            #
# --------------------------------------------------------------------------- #


def test_save_stores_one_row_with_identity_and_timestamps():
    repository = ReportRepository(InMemoryReportStore())

    row, created = repository.save(draft())

    assert created is True
    assert row["id"]
    assert row["status"] == "draft"
    assert row["created_at"] and row["updated_at"]
    assert row["fingerprint"] is not None
    assert row["latitude"] == pytest.approx(18.50123)
    # Nothing the analysis did not return is invented.
    assert row["estimated_cost_min"] is None
    assert row["estimated_cost_max"] is None


def test_repeating_the_same_client_report_id_does_not_duplicate():
    store = InMemoryReportStore()
    repository = ReportRepository(store)
    first, _ = repository.save(draft())

    second, created = repository.save(draft(description="Edited wording before the second click"))

    assert created is False
    assert second["id"] == first["id"], "the stored row is returned untouched"
    assert second["description"] == first["description"]
    assert len(repository.list()) == 1


def test_same_photo_same_place_within_the_window_is_a_duplicate():
    repository = ReportRepository(InMemoryReportStore())
    first, _ = repository.save(draft(client_report_id="session-aaaaaaaa-2222"))

    second, created = repository.save(draft(client_report_id="session-bbbbbbbb-3333"))

    assert created is False
    assert second["id"] == first["id"]
    assert len(repository.list()) == 1


def test_a_different_photo_at_the_same_place_is_a_new_report():
    repository = ReportRepository(InMemoryReportStore())
    repository.save(draft(client_report_id="session-aaaaaaaa-4444"))

    _, created = repository.save(draft(client_report_id="session-bbbbbbbb-5555", image_sha256="d" * 64))

    assert created is True
    assert len(repository.list()) == 2


def test_no_image_hash_means_no_fingerprint_dedupe():
    repository = ReportRepository(InMemoryReportStore())
    repository.save(draft(client_report_id="session-aaaaaaaa-6666", image_sha256=None))

    _, created = repository.save(draft(client_report_id="session-bbbbbbbb-7777", image_sha256=None))

    assert created is True, "two reports without a photo hash must both be kept"


def test_insert_race_returns_the_row_that_won():
    """A concurrent save with the same key must not surface as an error."""

    class RacingStore(InMemoryReportStore):
        def __init__(self):
            super().__init__()
            self.hidden = None

        def get_by_client_id(self, client_report_id):
            # The first lookup misses, exactly as it would for two simultaneous saves.
            return self.hidden

        def insert(self, record):
            self.hidden = {**record, "id": "winner-id", "description": "stored by the other request"}
            raise DuplicateReport(record["client_report_id"])

    repository = ReportRepository(RacingStore())
    row, created = repository.save(draft())

    assert created is False
    assert row["id"] == "winner-id"


def test_only_coordinate_reports_appear_on_the_map():
    repository = ReportRepository(InMemoryReportStore())
    repository.save(draft(client_report_id="session-located-0001"))
    repository.save(
        draft(
            client_report_id="session-unlocated-02",
            image_sha256="e" * 64,
            latitude=None,
            longitude=None,
            location="Near the vegetable market",
        )
    )

    points = repository.map_points()

    assert len(points) == 1
    assert points[0]["latitude"] == pytest.approx(18.50123)
    assert len(repository.list()) == 2, "the report without coordinates is still saved"


def test_stats_count_severity_resolution_and_coordinates():
    repository = ReportRepository(InMemoryReportStore())
    repository.save(draft(client_report_id="session-stats-0001", severity="Critical"))
    repository.save(draft(client_report_id="session-stats-0002", image_sha256="f" * 64, severity="Low", latitude=None, longitude=None))
    third, _ = repository.save(draft(client_report_id="session-stats-0003", image_sha256="1" * 64, severity="Medium"))
    repository.update_status(third["id"], "resolved")

    stats = repository.stats()

    assert stats["total"] == 3
    assert stats["high_severity"] == 1
    assert stats["resolved"] == 1
    assert stats["with_coordinates"] == 2
    assert stats["by_severity"]["Low"] == 1
    assert stats["by_status"]["resolved"] == 1
    assert stats["truncated"] is False


def test_update_status_reports_a_missing_row():
    repository = ReportRepository(InMemoryReportStore())
    assert repository.update_status("2f1c4a1e-0000-4000-8000-000000000000", "resolved") is None


def test_list_filters_by_category_severity_status_and_location():
    repository = ReportRepository(InMemoryReportStore())
    repository.save(draft(client_report_id="session-filter-0001", severity="High"))
    repository.save(
        draft(
            client_report_id="session-filter-0002",
            image_sha256="2" * 64,
            issue_category="waste-management",
            severity="Low",
            status="ready_to_submit",
            latitude=None,
            longitude=None,
        )
    )

    assert len(repository.list(category="road-damage")) == 1
    assert len(repository.list(severity="Low")) == 1
    assert len(repository.list(status="ready_to_submit")) == 1
    assert len(repository.list(located=True)) == 1
    assert len(repository.list(located=False)) == 1


# --------------------------------------------------------------------------- #
# Supabase adapter (fake PostgREST client)                                     #
# --------------------------------------------------------------------------- #


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    """Enough of the supabase-py query builder to exercise the adapter."""

    def __init__(self, rows, calls, action, payload=None):
        self.rows = rows
        self.calls = calls
        self.action = action
        self.payload = payload
        self.filters = []
        self.negate_next = False
        self.max_rows = None
        self.offset = 0
        self.ordering = None

    # builder methods ---------------------------------------------------- #
    @property
    def not_(self):
        self.negate_next = True
        return self

    def _filter(self, kind, column, value):
        self.filters.append((kind, column, value, self.negate_next))
        self.negate_next = False
        return self

    def select(self, columns="*", **_kwargs):
        self.calls.append(("select", columns))
        return self

    def eq(self, column, value):
        return self._filter("eq", column, value)

    def gte(self, column, value):
        return self._filter("gte", column, value)

    def is_(self, column, value):
        return self._filter("is", column, value)

    def order(self, column, desc=False):
        self.ordering = (column, desc)
        return self

    def limit(self, count):
        self.max_rows = count
        return self

    def range(self, start, end):
        self.offset, self.max_rows = start, end - start + 1
        return self

    def update(self, payload):
        self.action, self.payload = "update", payload
        return self

    def upsert(self, payload, on_conflict=None, ignore_duplicates=False):
        self.action, self.payload = "upsert", payload
        self.calls.append(("upsert", on_conflict, ignore_duplicates))
        return self

    # execution ---------------------------------------------------------- #
    def _matches(self, row):
        for kind, column, value, negate in self.filters:
            actual = row.get(column)
            if kind == "eq":
                ok = actual == value
            elif kind == "gte":
                ok = (actual or "") >= value
            else:  # is
                ok = (actual is None) == (value == "null")
            if negate:
                ok = not ok
            if not ok:
                return False
        return True

    def execute(self):
        if self.action == "upsert":
            return self._execute_upsert()
        if self.action == "update":
            return self._execute_update()

        selected = [row for row in self.rows if self._matches(row)]
        if self.ordering:
            column, desc = self.ordering
            selected.sort(key=lambda row: row.get(column) or "", reverse=desc)
        if self.offset or self.max_rows is not None:
            end = None if self.max_rows is None else self.offset + self.max_rows
            selected = selected[self.offset : end]
        return FakeResponse([dict(row) for row in selected])

    def _execute_upsert(self):
        payload = self.payload or []
        rows = payload if isinstance(payload, list) else [payload]
        inserted = []
        for row in rows:
            if any(existing["client_report_id"] == row["client_report_id"] for existing in self.rows):
                continue  # ON CONFLICT DO NOTHING
            self.rows.append(dict(row))
            inserted.append(dict(row))
        return FakeResponse(inserted)

    def _execute_update(self):
        updated = []
        for row in self.rows:
            if self._matches(row):
                row.update(self.payload or {})
                updated.append(dict(row))
        return FakeResponse(updated)


class FakeClient:
    def __init__(self, rows=None):
        self.rows = list(rows or [])
        self.calls = []
        self.error = None

    def table(self, name):
        self.calls.append(("table", name))
        if self.error:
            raise self.error
        return FakeQuery(self.rows, self.calls, "select")


def test_supabase_store_inserts_and_detects_conflicts():
    client = FakeClient()
    store = SupabaseReportStore(client=client, table="civic_reports")

    row = {**draft().to_record(), "id": "row-1", "created_at": "2026-10-01T00:00:00+00:00"}
    stored = store.insert(row)

    assert stored["id"] == "row-1"
    assert ("upsert", "client_report_id", True) in client.calls, "conflict handling must be delegated to the database"

    with pytest.raises(DuplicateReport):
        store.insert(row)


def test_supabase_store_lists_newest_first_and_filters_coordinates():
    client = FakeClient(
        [
            {"id": "old", "client_report_id": "c1", "created_at": "2026-10-01T00:00:00+00:00", "latitude": None, "longitude": None},
            {"id": "new", "client_report_id": "c2", "created_at": "2026-10-02T00:00:00+00:00", "latitude": 19.0, "longitude": 72.9},
        ]
    )
    store = SupabaseReportStore(client=client, table="civic_reports")

    assert [row["id"] for row in store.list()] == ["new", "old"]
    located = store.list(located=True)
    assert [row["id"] for row in located] == ["new"]
    assert [row["id"] for row in store.list(located=False)] == ["old"]


def test_supabase_store_translates_a_missing_table():
    class FailingClient(FakeClient):
        def table(self, name):
            raise SimpleNamespaceError("PGRST205", "Could not find the table 'public.civic_reports' in the schema cache")

    store = SupabaseReportStore(client=FailingClient(), table="civic_reports")

    with pytest.raises(ReportStoreError) as failure:
        store.list()

    assert "supabase_setup.sql" in failure.value.detail
    assert "PGRST205" in failure.value.log


def test_supabase_store_translates_permission_failures():
    store = SupabaseReportStore(
        client=SimpleNamespaceErrorClient("42501", "permission denied for table civic_reports"),
        table="civic_reports",
    )

    with pytest.raises(ReportStoreError) as failure:
        store.insert({"client_report_id": "x" * 10})

    assert "service_role" in failure.value.detail


class SimpleNamespaceError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


class SimpleNamespaceErrorClient(FakeClient):
    def __init__(self, code, message):
        super().__init__()
        self._error = SimpleNamespaceError(code, message)

    def table(self, name):
        raise self._error
