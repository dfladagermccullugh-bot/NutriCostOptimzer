"""SSRF / endpoint-allowlist guard for the AI proxy (audit M2).

The backend forwards the user's API key to a user-supplied endpoint. On a public deployment this
must be constrained so a user can't point it at internal addresses (cloud metadata, private hosts).
Self-hosters can opt out via AI_ALLOW_ANY_ENDPOINT, or extend the allowlist via AI_ENDPOINT_ALLOWLIST.
"""
import ipaddress
import os
from urllib.parse import urlparse

# Well-known OpenAI-compatible providers, allowed by default.
DEFAULT_ALLOWED_HOSTS = (
    "api.openai.com",
    "openrouter.ai",
    "api.groq.com",
    "api.together.xyz",
    "api.mistral.ai",
    "api.deepseek.com",
    "api.perplexity.ai",
    "api.fireworks.ai",
)


def _env_allowlist() -> tuple[str, ...]:
    extra = os.environ.get("AI_ENDPOINT_ALLOWLIST", "")
    hosts = tuple(h.strip().lower() for h in extra.split(",") if h.strip())
    return DEFAULT_ALLOWED_HOSTS + hosts


def _env_allow_any() -> bool:
    return os.environ.get("AI_ALLOW_ANY_ENDPOINT", "").strip().lower() in ("1", "true", "yes")


def _is_internal_host(host: str) -> bool:
    if host.lower() in ("localhost", "localhost.localdomain", ""):
        return True
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False  # a hostname, not an IP literal — allowlist handles it
    return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_unspecified


def validate_ai_endpoint(url: str | None, *, allow_any: bool | None = None, allowlist: tuple[str, ...] | None = None) -> str | None:
    """Return None if the endpoint is allowed, else a human-readable rejection reason."""
    allow_any = _env_allow_any() if allow_any is None else allow_any
    allowlist = _env_allowlist() if allowlist is None else allowlist

    if not url:
        return "No AI endpoint configured."

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return "AI endpoint must be an http(s) URL."

    host = (parsed.hostname or "").lower()
    if not host:
        return "AI endpoint has no host."

    if allow_any:
        return None

    if parsed.scheme != "https":
        return "AI endpoint must use https."

    if _is_internal_host(host):
        return "AI endpoint points to a private/internal address, which isn't allowed."

    if not any(host == a or host.endswith("." + a) for a in allowlist):
        return (
            "This AI endpoint host isn't on the allowlist. Use a known provider, or set "
            "AI_ENDPOINT_ALLOWLIST / AI_ALLOW_ANY_ENDPOINT on the server."
        )

    return None
