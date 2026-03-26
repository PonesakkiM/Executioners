"""
Exfiltration Detection Engine
Detects silent file copying (data theft without modification).

Real ransomware often exfiltrates data BEFORE encrypting — this catches that.

Detection methods:
  1. Read volume anomaly — process reads many files rapidly
  2. Honeypot file access — fake high-value files no legitimate process should read
  3. Access pattern scoring
"""
import os
import time
import threading
from collections import defaultdict
from db import log_threat_event
from config import SANDBOX_DIR

# Honeypot filenames — any read of these = immediate alert
HONEYPOT_FILES = {
    "_honeypot_passwords.txt",
    "_honeypot_credit_cards.csv",
    "_honeypot_ssh_keys.txt",
    "_honeypot_api_secrets.env",
}

# Track read events per process/path
_read_history: dict[str, list[float]] = defaultdict(list)
_lock = threading.Lock()

READ_WINDOW   = 10.0   # seconds
READ_THRESHOLD = 5     # reads within window = suspicious
SCORE_READ_ANOMALY = 35
SCORE_HONEYPOT_HIT = 100

# Shared exfiltration state
exfil_state = {
    "honeypot_hit": False,
    "honeypot_file": None,
    "read_anomaly": False,
    "read_count": 0,
    "score": 0,
    "events": [],
}

def deploy_honeypots(directory: str):
    """Create honeypot files in monitored directory."""
    honeypot_content = {
        "_honeypot_passwords.txt": (
            "HONEYPOT — SentinelShield Exfiltration Trap\n"
            "admin:P@ssw0rd123\nroot:toor\nbackup:backup2025\n"
        ),
        "_honeypot_credit_cards.csv": (
            "HONEYPOT — SentinelShield Exfiltration Trap\n"
            "card_number,expiry,cvv\n4111111111111111,12/27,123\n"
        ),
        "_honeypot_ssh_keys.txt": (
            "HONEYPOT — SentinelShield Exfiltration Trap\n"
            "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...[FAKE]\n"
        ),
        "_honeypot_api_secrets.env": (
            "HONEYPOT — SentinelShield Exfiltration Trap\n"
            "AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE\n"
            "AWS_SECRET=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n"
        ),
    }
    deployed = []
    for fname, content in honeypot_content.items():
        path = os.path.join(directory, fname)
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            deployed.append(fname)
    if deployed:
        log_threat_event("honeypots_deployed", 0, deployed, "exfiltration_traps_set")
        print(f"[Exfil] Honeypots deployed: {deployed}")
    return deployed

def is_honeypot(filepath: str) -> bool:
    return os.path.basename(filepath) in HONEYPOT_FILES

def handle_honeypot_access(filepath: str):
    """Called when a honeypot file is read — immediate critical alert."""
    fname = os.path.basename(filepath)
    with _lock:
        exfil_state["honeypot_hit"]  = True
        exfil_state["honeypot_file"] = fname
        exfil_state["score"]         = min(exfil_state["score"] + SCORE_HONEYPOT_HIT, 200)
        exfil_state["events"].insert(0, f"HONEYPOT ACCESSED: {fname}")
    log_threat_event(
        "honeypot_accessed", exfil_state["score"],
        [filepath], f"exfiltration_trap_triggered={fname}"
    )
    print(f"[Exfil] *** HONEYPOT HIT: {fname} — possible data exfiltration ***")

def record_file_read(filepath: str):
    """Track file read events for volume anomaly detection."""
    now = time.time()
    key = filepath
    with _lock:
        history = _read_history[key]
        history.append(now)
        _read_history[key] = [t for t in history if now - t <= READ_WINDOW]
        count = len(_read_history[key])
        exfil_state["read_count"] = sum(len(v) for v in _read_history.values())

    if count >= READ_THRESHOLD:
        with _lock:
            exfil_state["read_anomaly"] = True
            exfil_state["score"] = min(exfil_state["score"] + SCORE_READ_ANOMALY, 200)
            exfil_state["events"].insert(0, f"Read anomaly: {os.path.basename(filepath)} ({count}x in {READ_WINDOW}s)")
        log_threat_event(
            "read_volume_anomaly", exfil_state["score"],
            [filepath], f"reads={count}_in_{READ_WINDOW}s"
        )

def reset_exfil_state():
    with _lock:
        exfil_state["honeypot_hit"]  = False
        exfil_state["honeypot_file"] = None
        exfil_state["read_anomaly"]  = False
        exfil_state["read_count"]    = 0
        exfil_state["score"]         = 0
        exfil_state["events"]        = []
