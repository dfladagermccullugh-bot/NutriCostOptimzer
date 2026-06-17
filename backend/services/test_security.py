"""Tests for the AI endpoint SSRF guard (audit M2)."""
from backend.services.security import validate_ai_endpoint

ALLOW = ("api.openai.com", "openrouter.ai")


def ok(url, **kw):
    return validate_ai_endpoint(url, allowlist=ALLOW, **kw)


class TestValidateAiEndpoint:
    def test_allows_known_provider_over_https(self):
        assert ok("https://api.openai.com/v1/chat/completions") is None

    def test_allows_subdomain_of_allowlisted_host(self):
        assert ok("https://eu.openrouter.ai/v1/chat") is None

    def test_rejects_unknown_host(self):
        assert ok("https://evil.example.com/v1") is not None

    def test_rejects_plain_http_when_not_allow_any(self):
        assert ok("http://api.openai.com/v1") is not None

    def test_rejects_loopback_and_private_and_metadata(self):
        for url in (
            "https://127.0.0.1/v1",
            "https://localhost/v1",
            "https://10.0.0.5/v1",
            "https://192.168.1.10/v1",
            "https://169.254.169.254/latest/meta-data",  # cloud metadata
        ):
            assert ok(url) is not None, url

    def test_rejects_empty_or_non_http(self):
        assert ok("") is not None
        assert ok("ftp://api.openai.com/x") is not None

    def test_allow_any_permits_anything(self):
        assert ok("http://localhost:1234/v1", allow_any=True) is None
        assert ok("https://anything.internal/v1", allow_any=True) is None
