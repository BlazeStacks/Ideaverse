"""Request guard: concurrency cap and per-client rate limit (no network, no FastAPI)."""

import pytest

from request_guard import GuardRejected, RequestGuard


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def test_requests_within_limits_are_allowed():
    guard = RequestGuard(max_concurrent=2, max_requests=5, window_seconds=60)
    guard.acquire("a")
    guard.acquire("a")
    assert guard.running == 2


def test_concurrency_cap_rejects_with_429_and_release_frees_a_slot():
    guard = RequestGuard(max_concurrent=1, max_requests=10, window_seconds=60)
    guard.acquire("a")
    with pytest.raises(GuardRejected) as caught:
        guard.acquire("b")
    assert caught.value.status_code == 429
    assert caught.value.retry_after
    guard.release()
    guard.acquire("b")  # slot is free again


def test_rejected_request_does_not_consume_a_slot_or_rate_budget():
    guard = RequestGuard(max_concurrent=1, max_requests=2, window_seconds=60)
    guard.acquire("a")
    for _ in range(5):
        with pytest.raises(GuardRejected):
            guard.acquire("a")
    assert guard.running == 1
    guard.release()
    guard.acquire("a")  # only 2 starts counted so far, so this is the 2nd


def test_rate_limit_is_per_client_and_recovers_after_the_window():
    clock = Clock()
    guard = RequestGuard(max_concurrent=10, max_requests=2, window_seconds=60, clock=clock)
    for _ in range(2):
        guard.acquire("a")
        guard.release()

    with pytest.raises(GuardRejected) as caught:
        guard.acquire("a")
    assert caught.value.status_code == 429
    assert 1 <= caught.value.retry_after <= 61

    guard.acquire("b")  # a different client is unaffected
    guard.release()

    clock.now += 61
    guard.acquire("a")  # window has passed
    guard.release()


def test_release_never_goes_negative():
    guard = RequestGuard()
    guard.release()
    assert guard.running == 0
