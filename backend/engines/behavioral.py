"""
Behavioral Threat Scoring Engine
Detects ransomware-like behavior via:
  - Rapid file modifications
  - File entropy analysis (high entropy = likely encrypted)
  - Unknown processes accessing multiple files
"""
import math
import time
import os
from collections import defaultdict
from db import log_threat_event

# Track modification timestamps per file
_mod_history: dict[str, list[float]] = defaultdict(list)
RAPID_MOD_WINDOW = 5.0   # seconds
RAPID_MOD_COUNT  = 3     # modifications within window = suspicious

def shannon_entropy(filepath: str) -> float:
    """Calculate Shannon entropy of a file (0-8 bits). >7.0 suggests encryption."""
    try:
        with open(filepath, "rb") as f:
            data = f.read(65536)  # read up to 64KB
        if not data:
            return 0.0
        freq = defaultdict(int)
        for byte in data:
            freq[byte] += 1
        length = len(data)
        entropy = -sum((c / length) * math.log2(c / length) for c in freq.values())
        return round(entropy, 3)
    except Exception:
        return 0.0

def record_modification(filepath: str, state: dict) -> int:
    """Record a file modification and return score delta."""
    now = time.time()
    history = _mod_history[filepath]
    history.append(now)
    # Keep only events within window
    _mod_history[filepath] = [t for t in history if now - t <= RAPID_MOD_WINDOW]

    score_delta = 0

    # Rapid modification check
    if len(_mod_history[filepath]) >= RAPID_MOD_COUNT:
        score_delta += 30
        log_threat_event("rapid_modification", state.get("threat_score", 0) + score_delta,
                         [filepath], "behavioral_flag")

    # Entropy check
    entropy = shannon_entropy(filepath)
    if entropy > 7.0:
        score_delta += 40
        log_threat_event("high_entropy_detected", state.get("threat_score", 0) + score_delta,
                         [filepath], f"entropy={entropy}")

    return score_delta

def check_rename_pattern(src: str, dst: str) -> int:
    """Detect ransomware-style rename (e.g. adding .locked extension)."""
    suspicious_exts = {".locked", ".encrypted", ".enc", ".crypt", ".crypto", ".ransom"}
    _, ext = os.path.splitext(dst)
    if ext.lower() in suspicious_exts:
        log_threat_event("suspicious_rename", 50, [src, dst], "rename_pattern_detected")
        return 50
    return 0
