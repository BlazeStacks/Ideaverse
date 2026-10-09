"""Small in-memory request guard for POST /analyze.

Two cheap protections that are useful even for a demo (they keep a stuck
browser tab or a script from burning through the Groq quota):

* a cap on how many analyses may run at the same time, and
* a per-client cap on how many analyses may start per time window.

This is deliberately simple: state lives in this process only, so it resets on
restart and is not shared between multiple server workers. That is fine for a
single local ``uvicorn`` process. A real deployment would need a shared store.

Free of FastAPI so it can be unit-tested on its own. The server is single
threaded asyncio, so no locking is needed: ``acquire`` and ``release`` never
yield control between reading and updating the counters.
"""

import time
from collections import deque
from collections.abc import Callable

# Never track more clients than this, so memory cannot grow without bound.
_MAX_TRACKED_CLIENTS = 1000


class GuardRejected(Exception):
    """The request was refused. Carries the HTTP status and a safe message."""

    def __init__(self, status_code: int, detail: str, retry_after: int | None = None):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.retry_after = retry_after


class RequestGuard:
    def __init__(
        self,
        max_concurrent: int = 2,
        max_requests: int = 10,
        window_seconds: float = 60.0,
        clock: Callable[[], float] = time.monotonic,
    ):
        self.max_concurrent = max_concurrent
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._clock = clock
        self._running = 0
        self._starts: dict[str, deque[float]] = {}

    @property
    def running(self) -> int:
        return self._running

    def acquire(self, client_id: str) -> None:
        """Reserve a slot, or raise ``GuardRejected``. Pair with ``release``."""
        now = self._clock()

        if self._running >= self.max_concurrent:
            raise GuardRejected(
                429,
                "The server is already analysing other images. Please wait a "
                "few seconds and retry.",
                retry_after=5,
            )

        starts = self._starts.get(client_id)
        if starts is None:
            if len(self._starts) >= _MAX_TRACKED_CLIENTS:
                self._forget_idle_clients(now)
            starts = self._starts.setdefault(client_id, deque())

        while starts and now - starts[0] >= self.window_seconds:
            starts.popleft()

        if len(starts) >= self.max_requests:
            wait = max(1, int(self.window_seconds - (now - starts[0])) + 1)
            raise GuardRejected(
                429,
                f"Too many analysis requests. Please wait about {wait} seconds and retry.",
                retry_after=wait,
            )

        starts.append(now)
        self._running += 1

    def release(self) -> None:
        self._running = max(0, self._running - 1)

    def _forget_idle_clients(self, now: float) -> None:
        for client_id in [
            key
            for key, starts in self._starts.items()
            if not starts or now - starts[-1] >= self.window_seconds
        ]:
            del self._starts[client_id]
