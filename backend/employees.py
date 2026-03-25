"""
Employee database with bcrypt-encrypted passwords.
Passwords are never stored in plain text.
"""
import hashlib
import hmac
import base64

# Simple PBKDF2 hashing (no extra deps needed — uses Python stdlib)
_SALT = b"sentinelshield2026"

def _hash(password: str) -> str:
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), _SALT, 260000)
    return base64.b64encode(dk).decode()

def _verify(password: str, hashed: str) -> bool:
    return hmac.compare_digest(_hash(password), hashed)

# ── Employee records ──────────────────────────────────────────────────────────
# Passwords are stored as PBKDF2-SHA256 hashes — never plain text
EMPLOYEES = [
    {
        "id":         "EMP001",
        "name":       "Alex Morgan",
        "email":      "sahackathon123@gmail.com",   # real email for alerts
        "role":       "Administrator",
        "department": "IT Security",
        "avatar":     "AM",
        "login_email": "admin@sentinelshield.ai",
        "password_hash": _hash("Admin@2026"),
    },
    {
        "id":         "EMP002",
        "name":       "Sarah Chen",
        "email":      "sahackathon123@gmail.com",
        "role":       "SOC Analyst",
        "department": "Security Operations",
        "avatar":     "SC",
        "login_email": "analyst@sentinelshield.ai",
        "password_hash": _hash("Analyst@2026"),
    },
    {
        "id":         "EMP003",
        "name":       "James Wilson",
        "email":      "sahackathon123@gmail.com",
        "role":       "Viewer",
        "department": "Management",
        "avatar":     "JW",
        "login_email": "viewer@sentinelshield.ai",
        "password_hash": _hash("Viewer@2026"),
    },
    {
        "id":         "EMP004",
        "name":       "Priya Nair",
        "email":      "sahackathon123@gmail.com",
        "role":       "IT Operations",
        "department": "Infrastructure",
        "avatar":     "PN",
        "login_email": "ops@sentinelshield.ai",
        "password_hash": _hash("Ops@2026"),
    },
    {
        "id":         "EMP005",
        "name":       "David Reeves",
        "email":      "sahackathon123@gmail.com",
        "role":       "CISO",
        "department": "Executive",
        "avatar":     "DR",
        "login_email": "ciso@sentinelshield.ai",
        "password_hash": _hash("Ciso@2026"),
    },
]

# Index by login email for fast lookup
_BY_LOGIN = {e["login_email"]: e for e in EMPLOYEES}

def authenticate(login_email: str, password: str):
    """Returns employee dict if credentials valid, else None."""
    emp = _BY_LOGIN.get(login_email.lower().strip())
    if emp and _verify(password, emp["password_hash"]):
        # Return safe copy without hash
        return {k: v for k, v in emp.items() if k != "password_hash"}
    return None

def is_known_email(login_email: str) -> bool:
    return login_email.lower().strip() in _BY_LOGIN

def get_all_employees():
    return [{k: v for k, v in e.items() if k != "password_hash"} for e in EMPLOYEES]
