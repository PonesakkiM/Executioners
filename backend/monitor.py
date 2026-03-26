"""
File System Monitor
Uses watchdog to watch sandbox directories in real time.
Feeds events into the behavioral and canary engines.
"""
import os
import threading
import psutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from engines.canary import is_canary, handle_canary_hit
from engines.behavioral import record_modification, check_rename_pattern
from engines.exfiltration import is_honeypot, handle_honeypot_access, record_file_read
from db import log_threat_event
from config import QUARANTINE_DIR, THREAT_SCORE_THRESHOLD

# Shared state (in-memory for demo; persisted to Supabase)
state = {
    "threat_score": 0,
    "canary_hit": False,
    "status": "secure",   # secure | warning | critical
    "recent_events": [],
    "monitored_paths": [],
}

_observer = None
_lock = threading.Lock()

def _push_event(msg: str):
    with _lock:
        state["recent_events"].insert(0, msg)
        state["recent_events"] = state["recent_events"][:100]

def _update_status():
    """Status is driven by BOTH threat_score AND canary_hit together.
    They must be consistent — if score is 0, status must be secure."""
    score = state["threat_score"]
    canary = state["canary_hit"]
    if score >= THREAT_SCORE_THRESHOLD or (canary and score > 0):
        state["status"] = "critical"
    elif score >= 30:
        state["status"] = "warning"
    else:
        # Score is 0 — always secure regardless of stale canary flag
        state["status"] = "secure"
        state["canary_hit"] = False  # auto-clear stale canary flag when score is 0

class SentinelHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory:
            return
        path = event.src_path
        if is_canary(path):
            handle_canary_hit(path, state)
            _push_event(f"CANARY HIT: {path}")
        else:
            delta = record_modification(path, state)
            if delta > 0:
                with _lock:
                    state["threat_score"] = min(state["threat_score"] + delta, 200)
                _push_event(f"Behavioral flag (+{delta}): {path}")
        _update_status()

    def on_moved(self, event):
        delta = check_rename_pattern(event.src_path, event.dest_path)
        if delta > 0:
            with _lock:
                state["threat_score"] = min(state["threat_score"] + delta, 200)
            _push_event(f"Suspicious rename: {event.src_path} → {event.dest_path}")
        _update_status()

    def on_created(self, event):
        if not event.is_directory:
            _push_event(f"File created: {event.src_path}")
            # Check if a honeypot was accessed (created = opened for write by attacker)
            if is_honeypot(event.src_path):
                handle_honeypot_access(event.src_path)
                _push_event(f"HONEYPOT HIT: {event.src_path}")
                _update_status()

    def on_opened(self, event):
        """Detect file reads for exfiltration detection."""
        if event.is_directory:
            return
        path = event.src_path
        if is_honeypot(path):
            handle_honeypot_access(path)
            _push_event(f"HONEYPOT ACCESSED (read): {path}")
            _update_status()
        else:
            record_file_read(path)

def start_monitoring(paths: list):
    global _observer
    if _observer and _observer.is_alive():
        _observer.stop()
        _observer.join()

    # Always reset state cleanly when monitoring starts
    with _lock:
        state["threat_score"] = 0
        state["canary_hit"]   = False
        state["status"]       = "secure"

    _observer = Observer()
    handler = SentinelHandler()
    for p in paths:
        if os.path.exists(p):
            _observer.schedule(handler, p, recursive=True)
            state["monitored_paths"] = list(set(state["monitored_paths"] + [p]))
            _push_event(f"Monitoring started: {p}")

    _observer.start()
    log_threat_event("monitoring_started", 0, paths, "watchdog_observer_started")

def stop_monitoring():
    global _observer
    if _observer:
        _observer.stop()
        _observer.join()
        _observer = None

def reset_threat_score():
    with _lock:
        state["threat_score"] = 0
        state["canary_hit"] = False
        state["status"] = "secure"

def terminate_suspicious_processes(keywords: list = None) -> list:
    """Terminate processes matching suspicious keywords (demo-safe)."""
    if keywords is None:
        keywords = ["simulate_attack", "ransomware_sim"]
    killed = []
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            cmdline = " ".join(proc.info.get("cmdline") or []).lower()
            name = (proc.info.get("name") or "").lower()
            if any(k in cmdline or k in name for k in keywords):
                proc.kill()
                killed.append({"pid": proc.pid, "name": proc.info["name"]})
                log_threat_event("process_terminated", state["threat_score"],
                                 [proc.info["name"]], f"pid={proc.pid}")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return killed
