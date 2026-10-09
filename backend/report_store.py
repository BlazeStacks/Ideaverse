"""Persistence for civic reports: a thin store adapter plus the shared policy.

Two layers, deliberately separated:

``ReportStore`` (adapter)
    Talks to one storage engine. ``SupabaseReportStore`` is the real one;
    ``InMemoryReportStore`` exists so tests (and a local verification harness)
    can exercise the HTTP layer without a database. The application never
    selects the in-memory store on its own — ``get_report_store()`` raises
    ``StorageNotConfigured`` instead, so a missing database can never look like
    working persistence.

``ReportRepository`` (policy)
    Deduplication, id generation, timestamps, fingerprints and error
    translation. It is engine-independent, so the duplicate rules proven by the
    tests are the same rules production uses (an important detail: the
    policies are NOT reimplemented per engine).

Duplicate prevention, in order:

1. ``client_report_id`` — generated once per analysis in the browser and sent
   with every save attempt. A double click, a retry after a timeout or a
   resubmitted request therefore stores exactly one row. This is enforced by a
   UNIQUE constraint in the database as well as by the lookup below.
2. ``fingerprint`` — a hash of the photograph's bytes, the location text and the
   issue type. It only catches the same photograph being saved twice at the same
   place within ``FINGERPRINT_WINDOW_HOURS``. It is intentionally *not* based on
   location and issue type alone: two different potholes on the same street are
   two legitimate reports.
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

from fastapi import Depends, HTTPException

import db
from report_schemas import ReportCreate, ReportStatus
from db import StorageNotConfigured

logger = logging.getLogger("civicfix")

FINGERPRINT_WINDOW_HOURS = 24
DEFAULT_PAGE_SIZE = 200
MAX_PAGE_SIZE = 500
STATS_SCAN_LIMIT = 5000


class DuplicateReport(Exception):
    """The store already holds a report with this ``client_report_id``."""

    def __init__(self, client_report_id: str):
        super().__init__(f"Report {client_report_id} is already stored")
        self.client_report_id = client_report_id


class ReportStoreError(RuntimeError):
    """A storage engine refused a call. Carries a safe message and a log line."""

    def __init__(self, detail: str, *, log: str | None = None):
        super().__init__(detail)
        self.detail = detail
        self.log = log or detail


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime | None = None) -> str:
    """ISO-8601 UTC timestamp including microseconds.

    Microsecond precision matters: the report list is ordered by ``created_at``
    alone, so second-precision stamps would leave reports saved in the same
    second in an arbitrary order.
    """
    return (value or utcnow()).isoformat()


def report_fingerprint(*, image_sha256: str | None, location: str | None, issue_type: str | None, issue_category: str | None) -> str | None:
    """Hash the evidence that would make a second save an accident.

    Returns ``None`` when there is no image hash: without it, the only reliable
    duplicate signal is ``client_report_id``, and guessing from location/text
    alone would block genuine repeat reports.
    """
    if not image_sha256:
        return None
    parts = [
        (image_sha256 or "").strip().lower(),
        " ".join((location or "").split()).lower(),
        (issue_type or "").strip().lower(),
        (issue_category or "").strip().lower(),
    ]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------- #
# Adapters                                                                     #
# --------------------------------------------------------------------------- #


class SupabaseReportStore:
    """Report storage backed by a Supabase (PostgreSQL) table."""

    def __init__(self, client=None, table: str | None = None):
        self._client = client
        self._table = table
        self._table_error_logged = False

    # -- internals -------------------------------------------------------- #

    @property
    def client(self):
        return self._client if self._client is not None else db.get_client()

    @property
    def table(self) -> str:
        return self._table or db.reports_table()

    def _query(self):
        return self.client.table(self.table)

    def _run(self, action: str, build):
        """Execute a PostgREST call, translating every failure mode."""
        try:
            return build().execute()
        except Exception as exc:  # noqa: BLE001 - the SDK raises many types
            raise self._translate(action, exc)

    def _translate(self, action: str, exc: Exception) -> ReportStoreError:
        code = getattr(exc, "code", None)
        message = getattr(exc, "message", None) or str(exc)
        log = f"Supabase {action} failed on table {self.table}: code={code!r} message={message[:400]}"

        if code in {"42P01", "PGRST205", "PGRST106"} or "does not exist" in str(message):
            detail = (
                "The reports table does not exist in the configured Supabase project. "
                "Run backend/supabase_setup.sql in the Supabase SQL editor, then try again."
            )
        elif code in {"23505", "23514", "22P02"}:
            detail = (
                "The database rejected the report because a stored value broke a constraint. "
                "Check the column constraints in backend/supabase_setup.sql."
            )
        elif code in {"42501", "42P17", "PGRST301"}:
            detail = (
                "The database refused the request because of permissions. SUPABASE_KEY must be the "
                "service_role key (see backend/.env.example)."
            )
        else:
            detail = "Report storage reported an error. Nothing was saved."

        if not self._table_error_logged or code not in {"42P01", "PGRST205", "PGRST106"}:
            logger.error(log)
        self._table_error_logged = True
        return ReportStoreError(detail, log=log)

    @staticmethod
    def _rows(response) -> list[dict]:
        data = getattr(response, "data", None)
        return list(data) if isinstance(data, list) else []

    # -- ReportStore interface -------------------------------------------- #

    def insert(self, record: dict) -> dict:
        response = self._run(
            "insert",
            lambda: self._query().upsert(record, on_conflict="client_report_id", ignore_duplicates=True),
        )
        rows = self._rows(response)
        if not rows:
            # ON CONFLICT DO NOTHING returned nothing: the row already existed.
            raise DuplicateReport(record["client_report_id"])
        return rows[0]

    def get(self, report_id: str) -> dict | None:
        response = self._run("select by id", lambda: self._query().select("*").eq("id", report_id).limit(1))
        rows = self._rows(response)
        return rows[0] if rows else None

    def get_by_client_id(self, client_report_id: str) -> dict | None:
        response = self._run(
            "select by client_report_id",
            lambda: self._query().select("*").eq("client_report_id", client_report_id).limit(1),
        )
        rows = self._rows(response)
        return rows[0] if rows else None

    def find_recent_by_fingerprint(self, fingerprint: str, since: str) -> dict | None:
        response = self._run(
            "select by fingerprint",
            lambda: self._query()
            .select("*")
            .eq("fingerprint", fingerprint)
            .gte("created_at", since)
            .order("created_at", desc=True)
            .limit(1),
        )
        rows = self._rows(response)
        return rows[0] if rows else None

    def list(self, *, category=None, severity=None, status=None, located=None, limit=DEFAULT_PAGE_SIZE, offset=0) -> list[dict]:
        def build():
            query = self._query().select("*")
            if category:
                query = query.eq("issue_category", category)
            if severity:
                query = query.eq("severity", severity)
            if status:
                query = query.eq("status", status)
            if located is True:
                # The table constraint guarantees latitude and longitude are
                # either both present or both null, so one predicate is enough
                # (and it keeps the PostgREST chain simple).
                query = query.not_.is_("latitude", "null")
            elif located is False:
                query = query.is_("latitude", "null")
            return query.order("created_at", desc=True).range(offset, offset + limit - 1)

        return self._rows(self._run("list", build))

    def stats_rows(self) -> list[dict]:
        response = self._run(
            "stats scan",
            lambda: self._query().select("severity,status,latitude,longitude,created_at").order("created_at", desc=True).limit(STATS_SCAN_LIMIT),
        )
        return self._rows(response)

    def update_status(self, report_id: str, status: ReportStatus) -> dict | None:
        response = self._run(
            "update status",
            lambda: self._query()
            .update({"status": status, "status_updated_at": iso(), "updated_at": iso()})
            .eq("id", report_id),
        )
        rows = self._rows(response)
        return rows[0] if rows else None


class InMemoryReportStore:
    """In-process store used by tests and local verification harnesses only.

    It implements exactly the same interface and duplicate rules as
    ``SupabaseReportStore`` so behaviour is verified against the real policy.
    It is never selected automatically: losing reports on restart is not
    persistence, and the API must not pretend otherwise.
    """

    def __init__(self, rows: Iterable[dict] | None = None):
        self._rows: dict[str, dict] = {}
        self._by_client_id: dict[str, str] = {}
        for row in rows or []:
            self._rows[row["id"]] = dict(row)
            self._by_client_id[row["client_report_id"]] = row["id"]

    def insert(self, record: dict) -> dict:
        if record["client_report_id"] in self._by_client_id:
            raise DuplicateReport(record["client_report_id"])
        self._rows[record["id"]] = dict(record)
        self._by_client_id[record["client_report_id"]] = record["id"]
        return dict(record)

    def get(self, report_id: str) -> dict | None:
        row = self._rows.get(report_id)
        return dict(row) if row else None

    def get_by_client_id(self, client_report_id: str) -> dict | None:
        report_id = self._by_client_id.get(client_report_id)
        return self.get(report_id) if report_id else None

    def find_recent_by_fingerprint(self, fingerprint: str, since: str) -> dict | None:
        matches = [row for row in self._rows.values() if row.get("fingerprint") == fingerprint and row.get("created_at", "") >= since]
        if not matches:
            return None
        return dict(max(matches, key=lambda row: row.get("created_at", "")))

    def list(self, *, category=None, severity=None, status=None, located=None, limit=DEFAULT_PAGE_SIZE, offset=0) -> list[dict]:
        rows = sorted(self._rows.values(), key=lambda row: row.get("created_at", ""), reverse=True)
        filtered = []
        for row in rows:
            if category and row.get("issue_category") != category:
                continue
            if severity and row.get("severity") != severity:
                continue
            if status and row.get("status") != status:
                continue
            has_coords = row.get("latitude") is not None and row.get("longitude") is not None
            if located is True and not has_coords:
                continue
            if located is False and has_coords:
                continue
            filtered.append(dict(row))
        return filtered[offset : offset + limit]

    def stats_rows(self) -> list[dict]:
        keys = ("severity", "status", "latitude", "longitude", "created_at")
        return [{key: row.get(key) for key in keys} for row in self.list(limit=STATS_SCAN_LIMIT, offset=0)]

    def update_status(self, report_id: str, status: ReportStatus) -> dict | None:
        row = self._rows.get(report_id)
        if not row:
            return None
        row["status"] = status
        row["status_updated_at"] = iso()
        row["updated_at"] = iso()
        return dict(row)


# --------------------------------------------------------------------------- #
# Policy                                                                       #
# --------------------------------------------------------------------------- #


class ReportRepository:
    """Engine-independent rules for saving and reading reports."""

    def __init__(self, store):
        self.store = store

    # -- writing ----------------------------------------------------------- #

    def save(self, draft: ReportCreate) -> tuple[dict, bool]:
        """Store a report. Returns ``(row, created)``.

        ``created=False`` means an equivalent report was already stored and the
        existing row is returned untouched — no duplicate row, no error page.
        """
        existing = self.store.get_by_client_id(draft.client_report_id)
        if existing:
            return existing, False

        fingerprint = report_fingerprint(
            image_sha256=draft.image_sha256,
            location=draft.location,
            issue_type=draft.issue_type,
            issue_category=draft.issue_category,
        )
        if fingerprint:
            since = iso(utcnow() - timedelta(hours=FINGERPRINT_WINDOW_HOURS))
            recent = self.store.find_recent_by_fingerprint(fingerprint, since)
            if recent:
                return recent, False

        now = iso()
        record: dict[str, Any] = {
            **draft.to_record(),
            "id": str(uuid.uuid4()),
            "fingerprint": fingerprint,
            "status": draft.status,
            "status_updated_at": now,
            "created_at": now,
            "updated_at": now,
        }

        try:
            return self.store.insert(record), True
        except DuplicateReport:
            # Lost a race with a concurrent save using the same
            # client_report_id; return the row that won instead of failing.
            existing = self.store.get_by_client_id(draft.client_report_id)
            if existing:
                return existing, False
            raise

    def update_status(self, report_id: str, status: ReportStatus) -> dict | None:
        return self.store.update_status(report_id, status)

    # -- reading ----------------------------------------------------------- #

    def list(self, **filters) -> list[dict]:
        return self.store.list(**filters)

    def get(self, report_id: str) -> dict | None:
        return self.store.get(report_id)

    def map_points(self) -> list[dict]:
        """Reports that carry coordinates, for the incident map."""
        return self.store.list(located=True, limit=MAX_PAGE_SIZE, offset=0)

    def stats(self) -> dict:
        rows = self.store.stats_rows()
        by_severity: dict[str, int] = {}
        by_status: dict[str, int] = {}
        high = 0
        resolved = 0
        located = 0

        for row in rows:
            severity = row.get("severity") or "Uncertain"
            status = row.get("status") or "draft"
            by_severity[severity] = by_severity.get(severity, 0) + 1
            by_status[status] = by_status.get(status, 0) + 1
            if severity in {"High", "Critical"}:
                high += 1
            if status == "resolved":
                resolved += 1
            if row.get("latitude") is not None and row.get("longitude") is not None:
                located += 1

        return {
            "total": len(rows),
            "high_severity": high,
            "resolved": resolved,
            "with_coordinates": located,
            "by_severity": by_severity,
            "by_status": by_status,
            "scanned": len(rows),
            "truncated": len(rows) >= STATS_SCAN_LIMIT,
        }


# --------------------------------------------------------------------------- #
# FastAPI wiring                                                               #
# --------------------------------------------------------------------------- #


def get_report_store():
    """Provide the configured store, or refuse with an explanatory 503."""
    if not db.is_configured():
        raise HTTPException(status_code=503, detail=db.NOT_CONFIGURED_DETAIL)
    return SupabaseReportStore()


def get_report_repository(store=Depends(get_report_store)) -> ReportRepository:
    return ReportRepository(store)


def store_failure(error: ReportStoreError) -> HTTPException:
    """Map a storage failure to an HTTP response without leaking internals."""
    logger.error(error.log)
    return HTTPException(status_code=502, detail=error.detail)


__all__ = [
    "DuplicateReport",
    "InMemoryReportStore",
    "ReportRepository",
    "ReportStoreError",
    "StorageNotConfigured",
    "SupabaseReportStore",
    "get_report_repository",
    "get_report_store",
    "report_fingerprint",
    "store_failure",
]
