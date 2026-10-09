"""Turning an AI provider response (or failure) into a validated analysis or an
HTTP-friendly error.

Free of FastAPI and of the Groq SDK import so it can be unit-tested without
either. Provider exceptions are recognised by their class name and
``status_code`` attribute, which is how the Groq SDK exposes them
(``groq.RateLimitError``, ``groq.APITimeoutError`` and so on).
"""

import json
import re

from pydantic import ValidationError

from schemas import CivicAnalysis


class AnalysisFailure(Exception):
    """The analysis could not be produced. Carries the HTTP status and a safe message."""

    def __init__(self, status_code: int, detail: str, *, log: str | None = None):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        # Technical text for the server log only; never sent to the client.
        self.log = log or detail


_THINK_BLOCK = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)
_CODE_FENCE = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL | re.IGNORECASE)


def clean_model_text(content: str) -> str:
    """Remove wrappers some models add around JSON despite instructions.

    Reasoning models can emit a ``<think>...</think>`` block, and the prompt
    forbids but cannot prevent Markdown fences. Neither changes the answer.
    """
    text = _THINK_BLOCK.sub("", content).strip()
    fenced = _CODE_FENCE.match(text)
    return fenced.group(1).strip() if fenced else text


def parse_analysis(response) -> dict:
    """Validate a chat-completion response against ``CivicAnalysis``.

    Returns the analysis as a plain dict. Raises ``AnalysisFailure`` (HTTP 502)
    for an empty, truncated, non-JSON or schema-violating answer.
    """
    choices = getattr(response, "choices", None)
    if not choices:
        raise AnalysisFailure(
            502,
            "The AI returned no answer. Please retry.",
            log="Provider response contained no choices",
        )

    choice = choices[0]
    finish_reason = getattr(choice, "finish_reason", None)
    content = getattr(getattr(choice, "message", None), "content", None)

    if finish_reason == "length":
        raise AnalysisFailure(
            502,
            "The AI response was cut off before it finished. Please retry.",
            log="finish_reason=length (max_completion_tokens exhausted)",
        )

    if not isinstance(content, str) or not content.strip():
        raise AnalysisFailure(
            502,
            "The AI returned an empty response",
            log=f"Empty content (finish_reason={finish_reason!r})",
        )

    try:
        return CivicAnalysis.model_validate(
            json.loads(clean_model_text(content))
        ).model_dump()
    except (json.JSONDecodeError, ValidationError, ValueError) as exc:
        raise AnalysisFailure(
            502,
            "The AI returned an invalid analysis. Please retry.",
            log=f"Invalid AI response: {type(exc).__name__}: {str(exc)[:500]}",
        ) from exc


def translate_provider_error(exc: Exception, secret: str | None = None) -> AnalysisFailure:
    """Map an exception raised by the provider SDK to an HTTP error.

    The client message never contains provider internals. ``secret`` (the API
    key) is scrubbed from the log text as a precaution.
    """
    name = type(exc).__name__
    status = getattr(exc, "status_code", None)
    log = f"Groq API error: {name}: {exc}"
    if secret:
        log = log.replace(secret, "[redacted]")

    if name == "APITimeoutError":
        return AnalysisFailure(
            504, "The AI provider took too long to respond. Please retry.", log=log
        )
    if name == "APIConnectionError":
        return AnalysisFailure(
            503, "The AI provider could not be reached. Please retry shortly.", log=log
        )
    if status == 429:
        return AnalysisFailure(
            429, "The AI provider is rate limiting requests. Please retry shortly.", log=log
        )
    if status in (401, 403):
        return AnalysisFailure(
            502,
            "The server could not authenticate with the AI provider. "
            "The operator must check the API key.",
            log=log,
        )
    if status == 404:
        return AnalysisFailure(
            502,
            "The configured AI model is unavailable. The operator must check the model setting.",
            log=log,
        )
    if isinstance(status, int) and status >= 500:
        return AnalysisFailure(
            502, "The AI provider reported an error. Please retry shortly.", log=log
        )
    return AnalysisFailure(
        502,
        "Image analysis failed. The AI provider rejected or could not process the request.",
        log=log,
    )
