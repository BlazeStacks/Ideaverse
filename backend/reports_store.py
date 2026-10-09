"""Saved-report storage in Supabase (PostgreSQL), via its PostgREST HTTP API.

Only the backend talks to Supabase, using the secret/service-role key from
``backend/.env``. The key is never sent to the browser. No extra SDK is needed:
``httpx`` (already used by the tests) is enough for a handful of calls.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger("civicfix.reports")

TABLE = "reports"


class StoreUnavailable(Exception):
    """Supabase is not configured, unreachable, or rejected the request."""

    def __init__(self, detail: str, status_code: int = 503):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


class ReportStore:
    def __init__(self, url: str | None, secret_key: str | None, timeout: float = 10.0, transport=None):
        self._base = (url or "").strip().rstrip("/")
        self._key = (secret_key or "").strip()
        self._timeout = timeout
        self._transport = transport  # tests inject an httpx.MockTransport

    @property
    def configured(self) -> bool:
        return bool(self._base and self._key)

    # -- internals --------------------------------------------------------

    def _headers(self, **extra: str) -> dict[str, str]:
        return {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
            **extra,
        }

    async def _request(self, method: str, params: dict | None = None, json: Any = None,
                       headers: dict | None = None) -> list[dict]:
        if not self.configured:
            raise StoreUnavailable(
                "Report storage is not configured. Set SUPABASE_URL and "
                "SUPABASE_SECRET_KEY in backend/.env."
            )
        url = f"{self._base}/rest/v1/{TABLE}"
        try:
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as http:
                response = await http.request(
                    method, url, params=params, json=json, headers=headers or self._headers()
                )
        except httpx.HTTPError as exc:
            logger.error("Supabase request failed: %s", type(exc).__name__)
            raise StoreUnavailable("Could not reach the report database. Try again shortly.") from exc

        if response.status_code >= 400:
            # Log Supabase's message server-side; give the client a safe summary.
            logger.error("Supabase returned HTTP %s: %s", response.status_code, response.text[:300])
            if response.status_code in (401, 403):
                raise StoreUnavailable("The report database rejected the backend credentials.", 502)
            if response.status_code == 404:
                raise StoreUnavailable(
                    "The reports table was not found. Run backend/supabase_setup.sql in Supabase.", 502
                )
            if response.status_code in (400, 422):
                raise StoreUnavailable("The report database rejected this report.", 422)
            raise StoreUnavailable("The report database returned an error.", 502)

        try:
            data = response.json() if response.content else []
        except ValueError as exc:
            raise StoreUnavailable("The report database returned an unreadable response.", 502) from exc
        return data if isinstance(data, list) else [data]

    # -- operations -------------------------------------------------------

    async def create(self, row: dict) -> tuple[dict, bool]:
        """Insert a report. Returns ``(report, created)``.

        ``client_request_id`` is UNIQUE; a repeat submission inserts nothing
        and the originally saved report is returned with ``created=False``.
        """
        inserted = await self._request(
            "POST",
            params={"on_conflict": "client_request_id"},
            json=row,
            headers=self._headers(Prefer="resolution=ignore-duplicates,return=representation"),
        )
        if inserted:
            return inserted[0], True
        existing = await self._request(
            "GET", params={"client_request_id": f"eq.{row['client_request_id']}", "limit": "1"}
        )
        if not existing:
            raise StoreUnavailable("The report could not be saved.", 502)
        return existing[0], False

    async def list(self, *, category: str | None = None, severity: str | None = None,
                   status: str | None = None, has_coordinates: bool | None = None,
                   limit: int = 500) -> list[dict]:
        params: dict[str, str] = {"order": "created_at.desc", "limit": str(limit)}
        if category:
            params["issue_category"] = f"eq.{category}"
        if severity:
            params["severity"] = f"eq.{severity}"
        if status:
            params["status"] = f"eq.{status}"
        if has_coordinates:
            params["latitude"] = "not.is.null"
            params["longitude"] = "not.is.null"
        return await self._request("GET", params=params)

    async def get(self, report_id: str) -> dict | None:
        rows = await self._request("GET", params={"id": f"eq.{report_id}", "limit": "1"})
        return rows[0] if rows else None
