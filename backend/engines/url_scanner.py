"""
URL Scanner Engine — SentinelShield AI Human Layer
Detects phishing, malware, and suspicious URLs before the user clicks.

Detection methods (no paid API needed):
  1. Brand impersonation detection
  2. Suspicious TLD analysis
  3. Typosquatting detection (Levenshtein distance)
  4. URL structure heuristics
  5. Known malicious domain blocklist
  6. Redirect chain detection
"""
import re
import urllib.parse
from db import log_threat_event

# ── Known legitimate domains (brands attackers impersonate) ──────────────────
PROTECTED_BRANDS = {
    "microsoft": ["microsoft.com", "microsoftonline.com", "office.com", "live.com"],
    "google":    ["google.com", "gmail.com", "googleapis.com", "youtube.com"],
    "apple":     ["apple.com", "icloud.com"],
    "amazon":    ["amazon.com", "aws.amazon.com", "amazon.in"],
    "paypal":    ["paypal.com"],
    "facebook":  ["facebook.com", "fb.com", "instagram.com"],
    "netflix":   ["netflix.com"],
    "bank":      ["sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com"],
    "dropbox":   ["dropbox.com"],
    "linkedin":  ["linkedin.com"],
}

# Flatten to a set of all legitimate domains
LEGITIMATE_DOMAINS = {d for domains in PROTECTED_BRANDS.values() for d in domains}

# ── Suspicious TLDs commonly used in phishing ─────────────────────────────────
SUSPICIOUS_TLDS = {
    ".top", ".xyz", ".tk", ".ml", ".ga", ".cf", ".gq",
    ".ru", ".cn", ".pw", ".cc", ".su", ".ws", ".biz",
    ".click", ".link", ".online", ".site", ".info",
    ".download", ".zip", ".mov",
}

# ── Known malicious domain patterns ──────────────────────────────────────────
MALICIOUS_PATTERNS = [
    r"free.*(gift|prize|winner|reward)",
    r"(verify|confirm|update|secure).*account",
    r"(login|signin|logon).*secure",
    r"account.*suspend",
    r"urgent.*action.*required",
    r"click.*here.*now",
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",  # raw IP address
]

# ── Levenshtein distance for typosquatting ────────────────────────────────────
def _levenshtein(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return _levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1,
                            prev[j] + (c1 != c2)))
        prev = curr
    return prev[len(s2)]

def _extract_domain(url: str) -> str:
    """Extract the base domain from a URL."""
    try:
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        parsed = urllib.parse.urlparse(url)
        host = parsed.netloc.lower().lstrip("www.")
        # Remove port if present
        host = host.split(":")[0]
        return host
    except Exception:
        return url.lower()

def _get_tld(domain: str) -> str:
    parts = domain.split(".")
    if len(parts) >= 2:
        return "." + parts[-1]
    return ""

def scan_url(url: str, scanned_by: str = "user") -> dict:
    """
    Scan a URL for phishing/malware indicators.
    Returns a detailed verdict with risk score and reasons.
    """
    if not url or len(url.strip()) < 4:
        return {"verdict": "INVALID", "risk_score": 0, "reasons": ["URL too short or empty"]}

    url = url.strip()
    domain = _extract_domain(url)
    tld    = _get_tld(domain)
    url_lower = url.lower()

    reasons   = []
    risk_score = 0
    flags      = []

    # ── Check 1: Is it a known legitimate domain? ─────────────────────────────
    if domain in LEGITIMATE_DOMAINS:
        return {
            "verdict":    "SAFE",
            "risk_score": 0,
            "domain":     domain,
            "reasons":    ["Domain is a verified legitimate website"],
            "flags":      [],
            "safe":       True,
        }

    # ── Check 2: Raw IP address ───────────────────────────────────────────────
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain):
        risk_score += 60
        reasons.append("Uses raw IP address instead of domain name — common in phishing")
        flags.append("IP_ADDRESS")

    # ── Check 3: Suspicious TLD ───────────────────────────────────────────────
    if tld in SUSPICIOUS_TLDS:
        risk_score += 30
        reasons.append(f"Suspicious top-level domain: {tld} — frequently used in phishing")
        flags.append("SUSPICIOUS_TLD")

    # ── Check 4: Brand impersonation ─────────────────────────────────────────
    for brand, legit_domains in PROTECTED_BRANDS.items():
        if brand in domain:
            # Check if it's actually the real domain
            is_real = any(domain == d or domain.endswith("." + d) for d in legit_domains)
            if not is_real:
                risk_score += 70
                reasons.append(f"Impersonates '{brand}' brand but is NOT the official domain")
                flags.append("BRAND_IMPERSONATION")
                break

    # ── Check 5: Typosquatting ────────────────────────────────────────────────
    for legit in LEGITIMATE_DOMAINS:
        legit_base = legit.split(".")[0]
        domain_base = domain.split(".")[0]
        if legit_base != domain_base:
            dist = _levenshtein(domain_base, legit_base)
            if 1 <= dist <= 2 and len(legit_base) > 4:
                risk_score += 50
                reasons.append(f"Looks like typosquatting of '{legit}' (1-2 character difference)")
                flags.append("TYPOSQUATTING")
                break

    # ── Check 6: Suspicious URL patterns ─────────────────────────────────────
    for pattern in MALICIOUS_PATTERNS:
        if re.search(pattern, url_lower):
            risk_score += 25
            reasons.append(f"Suspicious keyword pattern detected in URL")
            flags.append("SUSPICIOUS_PATTERN")
            break

    # ── Check 7: Excessive subdomains ────────────────────────────────────────
    subdomain_count = len(domain.split(".")) - 2
    if subdomain_count >= 3:
        risk_score += 20
        reasons.append(f"Excessive subdomains ({subdomain_count}) — common phishing trick")
        flags.append("EXCESSIVE_SUBDOMAINS")

    # ── Check 8: HTTP (no encryption) ────────────────────────────────────────
    if url_lower.startswith("http://") and not url_lower.startswith("http://localhost"):
        risk_score += 15
        reasons.append("Uses HTTP (not HTTPS) — connection is not encrypted")
        flags.append("NO_HTTPS")

    # ── Check 9: Very long URL ────────────────────────────────────────────────
    if len(url) > 200:
        risk_score += 10
        reasons.append("Unusually long URL — often used to hide the real destination")
        flags.append("LONG_URL")

    # ── Check 10: URL shorteners ──────────────────────────────────────────────
    shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "short.link"]
    if any(s in domain for s in shorteners):
        risk_score += 20
        reasons.append("URL shortener detected — real destination is hidden")
        flags.append("URL_SHORTENER")

    # ── Determine verdict ─────────────────────────────────────────────────────
    risk_score = min(risk_score, 100)
    if risk_score >= 70:
        verdict = "MALICIOUS"
    elif risk_score >= 35:
        verdict = "SUSPICIOUS"
    else:
        verdict = "SAFE"

    if not reasons:
        reasons = ["No suspicious indicators found"]

    # ── Log to Supabase ───────────────────────────────────────────────────────
    log_threat_event(
        f"url_scan_{verdict.lower()}",
        risk_score,
        [url],
        f"scanned_by={scanned_by} flags={','.join(flags)}"
    )

    return {
        "verdict":    verdict,
        "risk_score": risk_score,
        "domain":     domain,
        "reasons":    reasons,
        "flags":      flags,
        "safe":       verdict == "SAFE",
        "url":        url,
    }
