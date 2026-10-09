"""Parsing of provider output and translation of provider failures.

Uses fake response objects. These tests exercise this application's own
validation logic only; they say nothing about whether the real provider
returns usable output (that needs a real request and an API key).
"""

import copy
import json
from types import SimpleNamespace

import pytest

from ai_response import (
    AnalysisFailure,
    clean_model_text,
    parse_analysis,
    translate_provider_error,
)

VALID = {
    "issue_type": "Pothole",
    "is_civic_issue": True,
    "confidence": 0.82,
    "severity": "High",
    "description": "A large pothole in the carriageway.",
    "observations": ["Broken asphalt", "Exposed base layer"],
    "safety_concerns": ["Risk to two-wheelers"],
    "suggested_department": "Roads department",
    "recommended_actions": ["Barricade and patch"],
    "resources": [{"item": "Cold mix asphalt", "purpose": "Temporary patching"}],
    "estimated_cost_inr": {"minimum": 2000, "maximum": 8000, "basis": "Small patch repair"},
    "estimated_duration_hours": {"minimum": 1, "maximum": 4, "basis": "Single crew"},
    "needs_site_inspection": True,
    "missing_information": ["Depth of the pothole"],
}


def response(content, finish_reason="stop"):
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                finish_reason=finish_reason,
                message=SimpleNamespace(content=content),
            )
        ]
    )


def variant(**changes):
    data = copy.deepcopy(VALID)
    data.update(changes)
    return data


def test_valid_analysis_round_trips():
    result = parse_analysis(response(json.dumps(VALID)))
    assert result["issue_type"] == "Pothole"
    assert result["severity"] == "High"
    assert result["estimated_cost_inr"]["minimum"] == 2000


def test_null_estimates_are_preserved_as_null_not_zero():
    data = variant(
        estimated_cost_inr={"minimum": None, "maximum": None, "basis": "Not enough evidence"},
        estimated_duration_hours={"minimum": None, "maximum": None, "basis": "Not enough evidence"},
    )
    result = parse_analysis(response(json.dumps(data)))
    assert result["estimated_cost_inr"]["minimum"] is None
    assert result["estimated_cost_inr"]["maximum"] is None
    assert result["estimated_duration_hours"]["minimum"] is None


def test_markdown_fences_and_think_blocks_are_tolerated():
    body = json.dumps(VALID)
    assert parse_analysis(response(f"```json\n{body}\n```"))["issue_type"] == "Pothole"
    assert parse_analysis(response(f"<think>hmm</think>\n{body}"))["issue_type"] == "Pothole"


def test_clean_model_text_leaves_plain_json_alone():
    assert clean_model_text('{"a": 1}') == '{"a": 1}'


@pytest.mark.parametrize(
    "bad_response, expected_log_fragment",
    [
        (SimpleNamespace(choices=[]), "no choices"),
        (SimpleNamespace(choices=None), "no choices"),
        (response(None), "Empty content"),
        (response("   \n"), "Empty content"),
        (response(json.dumps(VALID), finish_reason="length"), "finish_reason=length"),
        (response("I cannot analyse this image."), "Invalid AI response"),
        (response("[1, 2, 3]"), "Invalid AI response"),
        (response('{"issue_type": "Pothole"'), "Invalid AI response"),  # truncated JSON
        (response("{}"), "Invalid AI response"),
    ],
)
def test_unusable_provider_output_becomes_a_502_not_a_crash(bad_response, expected_log_fragment):
    with pytest.raises(AnalysisFailure) as caught:
        parse_analysis(bad_response)
    assert caught.value.status_code == 502
    assert expected_log_fragment in caught.value.log


@pytest.mark.parametrize(
    "changes",
    [
        {"severity": "Extreme"},
        {"confidence": 1.5},
        {"confidence": -0.1},
        {"is_civic_issue": "maybe"},
        {"observations": "not a list"},
        {"estimated_cost_inr": {"minimum": 10, "maximum": 5, "basis": "reversed"}},
        {"estimated_cost_inr": {"minimum": -1, "maximum": 5, "basis": "negative"}},
        {"estimated_duration_hours": {"minimum": None, "maximum": None}},  # basis missing
        {"resources": [{"item": "only an item"}]},
    ],
)
def test_schema_violations_are_rejected(changes):
    with pytest.raises(AnalysisFailure) as caught:
        parse_analysis(response(json.dumps(variant(**changes))))
    assert caught.value.status_code == 502
    assert "invalid analysis" in caught.value.detail


def test_failure_detail_for_the_client_hides_model_text():
    with pytest.raises(AnalysisFailure) as caught:
        parse_analysis(response("SECRET-MODEL-TEXT"))
    assert "SECRET-MODEL-TEXT" not in caught.value.detail


def make_error(name, status=None, message="boom"):
    error = type(name, (Exception,), {})(message)
    if status is not None:
        error.status_code = status
    return error


@pytest.mark.parametrize(
    "name, status, expected",
    [
        ("APITimeoutError", None, 504),
        ("APIConnectionError", None, 503),
        ("RateLimitError", 429, 429),
        ("AuthenticationError", 401, 502),
        ("PermissionDeniedError", 403, 502),
        ("NotFoundError", 404, 502),
        ("BadRequestError", 400, 502),
        ("UnprocessableEntityError", 422, 502),
        ("InternalServerError", 503, 502),
        ("RuntimeError", None, 502),
    ],
)
def test_provider_errors_map_to_http_statuses(name, status, expected):
    assert translate_provider_error(make_error(name, status)).status_code == expected


def test_api_key_is_redacted_from_logs_and_never_in_client_detail():
    key = "gsk_super_secret_value"
    failure = translate_provider_error(
        make_error("AuthenticationError", 401, f"Invalid API Key: {key}"), secret=key
    )
    assert key not in failure.log
    assert key not in failure.detail
    assert "[redacted]" in failure.log
