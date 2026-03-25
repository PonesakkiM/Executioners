"""
Canary Detection Engine
Deploys hidden sentinel files in monitored directories.
Any modification triggers a critical alert.
"""
import os
from db import log_threat_event

CANARY_FILENAME = "_sentinelshield_do_not_touch.txt"
CANARY_CONTENT  = "SentinelShield AI Canary File — Do Not Modify"

def deploy_canary(directory: str) -> str:
    """Create a canary file in the given directory. Returns its path."""
    os.makedirs(directory, exist_ok=True)
    path = os.path.join(directory, CANARY_FILENAME)
    with open(path, "w") as f:
        f.write(CANARY_CONTENT)
    log_threat_event("canary_deployed", 0, [path], "canary_created")
    print(f"[Canary] Deployed: {path}")
    return path

def is_canary(filepath: str) -> bool:
    return os.path.basename(filepath) == CANARY_FILENAME

def handle_canary_hit(filepath: str, state: dict):
    """Called when a canary file is accessed/modified."""
    print(f"[Canary] *** CANARY HIT: {filepath} ***")
    state["threat_score"] = min(state.get("threat_score", 0) + 100, 200)
    state["canary_hit"] = True
    log_threat_event("canary_accessed", state["threat_score"], [filepath], "critical_alert_raised")
