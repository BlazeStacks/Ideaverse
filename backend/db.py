"""Supabase (hosted PostgreSQL) connection for stored civic reports.

The analysis endpoint never touches the database. Report persistence is a
separate capability that is switched on by supplying credentials in
``backend/.env``:

    SUPABASE_URL=https://<project-ref>.supabase.co
    SUPABASE_KEY=<service_role key>          # server side only — never the anon key

Notes for whoever deploys this:

* The key is read on the server and is never sent to the browser. The frontend
  talks to this FastAPI app only.
* ``SUPABASE_KEY`` is the **service_role** key so the backend can insert rows
  while Row Level Security stays enabled on the table. With RLS on and no
  policies (the default in ``supabase_setup.sql``) the anon key cannot read or
  write the table at all, which is what we want for a public demo.
* ``SUPABASE_SERVICE_ROLE_KEY`` and ``SUPABASE_SERVICE_KEY`` are accepted as
  aliases so the name from the Supabase dashboard also works.
* The client library is imported lazily so the analysis endpoint keeps working
  (and the test suite keeps running) on a machine where the database extras are
  not installed or not configured.
"""

from __future__ import annotations

import logging
import os
import threading

logger = logging.getLogger("civicfix")

SUPABASE_URL_ENV = "SUPABASE_URL"
SUPABASE_KEY_ENV_NAMES = ("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_KEY")
REPORTS_TABLE_ENV = "SUPABASE_REPORTS_TABLE"

DEFAULT_REPORTS_TABLE = "civic_reports"

NOT_CONFIGURED_DETAIL = (
    "Report storage is not configured on the server. Add SUPABASE_URL and SUPABASE_KEY "
    "(the service_role key) to backend/.env, run backend/supabase_setup.sql in the Supabase "
    "SQL editor, and restart the API. Analyses still work without it — only saving is disabled."
)


class StorageNotConfigured(RuntimeError):
    """Raised when a persistence call is made without database credentials."""

    def __init__(self, detail: str = NOT_CONFIGURED_DETAIL):
        super().__init__(detail)
        self.detail = detail


def _clean(value: str | None) -> str:
    """Trim whitespace and the quotes people paste around .env values."""
    if not value:
        return ""
    return value.strip().strip('"').strip("'").strip()


def supabase_url() -> str:
    return _clean(os.getenv(SUPABASE_URL_ENV))


def supabase_key() -> tuple[str, str | None]:
    """Return ``(key, variable_name)`` for the first configured key variable."""
    for name in SUPABASE_KEY_ENV_NAMES:
        value = _clean(os.getenv(name))
        if value:
            return value, name
    return "", None


def reports_table() -> str:
    return _clean(os.getenv(REPORTS_TABLE_ENV)) or DEFAULT_REPORTS_TABLE


def is_configured() -> bool:
    """True when both credentials needed to reach the database are present."""
    return bool(supabase_url() and supabase_key()[0])


def host_only(url: str) -> str:
    """``https://abcd.supabase.co`` -> ``abcd.supabase.co`` (never the key)."""
    without_scheme = url.split("://", 1)[-1]
    return without_scheme.split("/", 1)[0]


def storage_status() -> dict:
    """Safe, non-secret description of the persistence configuration."""
    url = supabase_url()
    key, key_name = supabase_key()
    configured = bool(url and key)
    return {
        "configured": configured,
        "url_host": host_only(url) if url else None,
        "key_variable": key_name,
        "table": reports_table(),
        "detail": (
            f"Reports are stored in Supabase project {host_only(url)} "
            f"(table {reports_table()})."
            if configured
            else NOT_CONFIGURED_DETAIL
        ),
    }


_client_lock = threading.Lock()
_client = None
_client_signature: tuple[str, str, str] | None = None


def get_client():
    """Return a cached Supabase client, creating it on first use.

    The cache is keyed by the configured credentials so a test (or a settings
    change followed by ``reset_client_cache()``) cannot keep using a stale
    connection.
    """
    global _client, _client_signature

    url = supabase_url()
    key, _ = supabase_key()
    if not url or not key:
        raise StorageNotConfigured()

    signature = (url, key, reports_table())
    with _client_lock:
        if _client is not None and _client_signature == signature:
            return _client

        try:
            from supabase import create_client
        except ImportError as exc:  # pragma: no cover - depends on the install
            raise StorageNotConfigured(
                "The Supabase client library is not installed, so reports cannot be saved. "
                "Install the backend requirements (pip install -r requirements.txt) and restart the API."
            ) from exc

        try:
            client = create_client(url, key)
        except Exception as exc:
            # A malformed URL or key surfaces here. Log the technical text (the
            # key is scrubbed) and let the caller return a safe message.
            logger.error("Supabase client could not be created: %s", str(exc).replace(key, "[redacted]"))
            raise StorageNotConfigured(
                "The Supabase credentials in backend/.env were rejected, so reports cannot be saved. "
                "Check SUPABASE_URL and SUPABASE_KEY (service_role) and restart the API."
            ) from exc

        _client = client
        _client_signature = signature
        logger.info("Supabase client ready for table %s on %s", reports_table(), host_only(url))
        return _client


def reset_client_cache() -> None:
    """Drop the cached client (used by tests after changing the environment)."""
    global _client, _client_signature
    with _client_lock:
        _client = None
        _client_signature = None
