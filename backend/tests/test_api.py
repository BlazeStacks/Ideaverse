"""HTTP-level tests of the FastAPI app with a *fake* AI provider.

Requires fastapi, httpx and groq to be installed (``pip install -r
requirements.txt httpx pytest``); skipped otherwise. The provider is replaced
by a stub, so these tests prove the endpoint's contract and error handling,
NOT that the real Groq model produces a usable analysis.
"""

import json
import os
from io import BytesIO
from types import SimpleNamespace

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")
pytest.importorskip("groq")

os.environ.setdefault("GROQ_API_KEY", "test-key-not-real")

from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

import main  # noqa: E402
from request_guard import RequestGuard  # noqa: E402
from test_ai_response import VALID  # noqa: E402
from test_image_validation import png_declaring  # noqa: E402


def image_bytes(fmt="PNG"):
    buffer = BytesIO()
    Image.new("RGB", (32, 32), "grey").save(buffer, fmt)
    return buffer.getvalue()


class FakeProvider:
    """Stands in for `client`. Records calls; returns or raises what it is told."""

    def __init__(self, content=None, error=None, finish_reason="stop"):
        self.calls = []
        self._content = json.dumps(VALID) if content is None else content
        self._error = error
        self._finish_reason = finish_reason
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    async def _create(self, **kwargs):
        self.calls.append(kwargs)
        if self._error:
            raise self._error
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    finish_reason=self._finish_reason,
                    message=SimpleNamespace(content=self._content),
                )
            ]
        )


@pytest.fixture
def api(monkeypatch):
    # Fresh limits for every test so they cannot affect each other.
    monkeypatch.setattr(main, "guard", RequestGuard(max_concurrent=2, max_requests=100))

    def install(provider=None):
        provider = provider or FakeProvider()
        monkeypatch.setattr(main, "client", provider)
        return TestClient(main.app, raise_server_exceptions=False), provider

    return install


def post(client, data=None, filename="photo.png", content_type="image/png", **form):
    files = {"file": (filename, data if data is not None else image_bytes(), content_type)}
    return client.post("/analyze", files=files, data=form)


def test_health(api):
    client, _ = api()
    assert client.get("/health").json() == {"status": "ok"}


def test_successful_analysis_returns_schema_plus_metadata(api):
    client, provider = api()
    response = post(client, location="MG Road", additional_details="Since last week")
    assert response.status_code == 200
    body = response.json()
    for key in VALID:
        assert key in body
    assert body["location"] == "MG Road"
    assert body["model"] == main.MODEL
    assert body["estimate_status"] == "preliminary"
    assert body["authority_status"] == "not_submitted"

    (call,) = provider.calls
    assert call["model"] == main.MODEL
    assert call["response_format"] == {"type": "json_object"}
    image_part = call["messages"][1]["content"][1]
    assert image_part["image_url"]["url"].startswith("data:image/png;base64,")
    assert "MG Road" in call["messages"][1]["content"][0]["text"]


def test_location_and_details_are_optional(api):
    client, provider = api()
    response = post(client)
    assert response.status_code == 200
    assert response.json()["location"] == "Not provided"
    assert len(provider.calls) == 1


def test_file_is_required(api):
    client, provider = api()
    assert client.post("/analyze", data={"location": "x"}).status_code == 422
    assert provider.calls == []


@pytest.mark.parametrize("fmt, content_type", [("JPEG", "image/jpeg"), ("WEBP", "image/webp")])
def test_jpeg_and_webp_accepted(api, fmt, content_type):
    client, _ = api()
    assert post(client, image_bytes(fmt), "p", content_type).status_code == 200


@pytest.mark.parametrize(
    "payload, status",
    [
        (b"", 400),
        (b"definitely not an image", 400),
        (png_declaring(60000, 60000), 413),  # decompression bomb
        (png_declaring(8000, 8000), 413),
    ],
)
def test_bad_images_are_rejected_before_the_provider_is_called(api, payload, status):
    client, provider = api()
    response = post(client, payload)
    assert response.status_code == status
    assert "detail" in response.json()
    assert provider.calls == []


def test_gif_rejected_with_415(api):
    client, provider = api()
    buffer = BytesIO()
    Image.new("P", (8, 8)).save(buffer, "GIF")
    assert post(client, buffer.getvalue(), "a.gif", "image/gif").status_code == 415
    assert provider.calls == []


def test_oversized_upload_rejected_with_413(api):
    client, provider = api()
    too_big = image_bytes() + b"\0" * (main.MAX_FILE_SIZE + 1)
    assert post(client, too_big).status_code == 413
    assert provider.calls == []


@pytest.mark.parametrize(
    "provider, status",
    [
        (FakeProvider(error=type("RateLimitError", (Exception,), {"status_code": 429})("slow")), 429),
        (FakeProvider(error=type("APITimeoutError", (Exception,), {})("timeout")), 504),
        (FakeProvider(error=RuntimeError("anything else")), 502),
        (FakeProvider(content="not json"), 502),
        (FakeProvider(content=""), 502),
        (FakeProvider(finish_reason="length"), 502),
    ],
)
def test_provider_failures_become_http_errors_without_leaking_details(api, provider, status):
    client, _ = api(provider)
    response = post(client)
    assert response.status_code == status
    detail = response.json()["detail"]
    assert "Traceback" not in detail and "RuntimeError" not in detail


def test_cors_allows_configured_origin_only(api):
    client, _ = api()
    allowed = client.options(
        "/analyze",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    denied = client.options(
        "/analyze",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in denied.headers


def test_provider_receives_configured_completion_limit_and_no_reasoning_by_default(api, monkeypatch):
    monkeypatch.setattr(main, "REASONING_EFFORT", None)
    client, provider = api()
    assert post(client).status_code == 200
    (call,) = provider.calls
    assert call["max_completion_tokens"] == main.MAX_COMPLETION_TOKENS
    assert main.MAX_COMPLETION_TOKENS > 1800  # thinking tokens share this budget
    assert "reasoning_effort" not in call


def test_reasoning_effort_is_sent_only_when_configured(api, monkeypatch):
    monkeypatch.setattr(main, "REASONING_EFFORT", "none")
    client, provider = api()
    assert post(client).status_code == 200
    assert provider.calls[0]["reasoning_effort"] == "none"


def test_rate_limit_returns_429_with_retry_after_and_skips_the_provider(api, monkeypatch):
    monkeypatch.setattr(main, "guard", RequestGuard(max_concurrent=2, max_requests=1))
    client, provider = api()
    assert post(client).status_code == 200
    response = post(client)
    assert response.status_code == 429
    assert "Retry-After" in response.headers
    assert len(provider.calls) == 1


def test_concurrency_slot_is_released_after_success_and_after_failure(api):
    client, _ = api(FakeProvider(error=RuntimeError("boom")))
    assert post(client).status_code == 502
    assert main.guard.running == 0
    client, _ = api()
    assert post(client).status_code == 200
    assert main.guard.running == 0
    assert post(client, b"not an image").status_code == 400
    assert main.guard.running == 0
