"""
Quarantine Integrity Engine
SHA-256 hash verification for quarantined files.

Problem it solves:
  Attackers can tamper with quarantined files to prevent recovery,
  or replace them with malware. This engine:
  1. Hashes every file at quarantine time
  2. Stores the manifest in a separate location
  3. Verifies hash before any restore or delete operation
  4. Blocks restore if hash doesn't match (file was tampered)
"""
import os
import json
import hashlib
import stat
from datetime import datetime
from config import QUARANTINE_DIR

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "quarantine_manifest.json")

def _sha256(filepath: str) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def _load_manifest() -> dict:
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def _save_manifest(manifest: dict):
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)
    # Make manifest read-only so attacker can't tamper with it
    os.chmod(MANIFEST_PATH, stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)

def register_quarantine(filename: str) -> dict:
    """
    Called when a file is quarantined.
    Computes SHA-256 and stores in manifest.
    Returns the hash record.
    """
    fpath = os.path.join(QUARANTINE_DIR, filename)
    if not os.path.exists(fpath):
        return {"error": "File not found"}

    file_hash = _sha256(fpath)
    file_size = os.path.getsize(fpath)

    # Make manifest writable temporarily
    if os.path.exists(MANIFEST_PATH):
        os.chmod(MANIFEST_PATH, stat.S_IREAD | stat.S_IWRITE)

    manifest = _load_manifest()
    manifest[filename] = {
        "sha256":        file_hash,
        "size":          file_size,
        "quarantined_at": datetime.now().isoformat(),
        "verified":      True,
        "tampered":      False,
    }
    _save_manifest(manifest)

    print(f"[Integrity] Registered: {filename} → {file_hash[:16]}...")
    return manifest[filename]

def verify_integrity(filename: str) -> dict:
    """
    Verify a quarantined file hasn't been tampered with.
    Returns: {ok: bool, hash_match: bool, details: str}
    """
    fpath = os.path.join(QUARANTINE_DIR, filename)
    if not os.path.exists(fpath):
        return {"ok": False, "hash_match": False, "details": "File not found in quarantine"}

    manifest = _load_manifest()
    if filename not in manifest:
        return {"ok": False, "hash_match": False, "details": "No integrity record — file may have been added after quarantine"}

    record      = manifest[filename]
    stored_hash = record["sha256"]
    current_hash = _sha256(fpath)
    match        = stored_hash == current_hash

    if not match:
        # Mark as tampered in manifest
        if os.path.exists(MANIFEST_PATH):
            os.chmod(MANIFEST_PATH, stat.S_IREAD | stat.S_IWRITE)
        manifest[filename]["tampered"] = True
        manifest[filename]["verified"] = False
        _save_manifest(manifest)
        print(f"[Integrity] TAMPERED: {filename} — hash mismatch!")

    return {
        "ok":           match,
        "hash_match":   match,
        "stored_hash":  stored_hash[:16] + "...",
        "current_hash": current_hash[:16] + "...",
        "details":      "Integrity verified — file is safe to restore" if match
                        else "TAMPERED — file hash does not match original. Restore blocked.",
        "tampered":     not match,
        "quarantined_at": record.get("quarantined_at"),
        "size":         record.get("size"),
    }

def get_manifest() -> dict:
    return _load_manifest()

def remove_from_manifest(filename: str):
    if os.path.exists(MANIFEST_PATH):
        os.chmod(MANIFEST_PATH, stat.S_IREAD | stat.S_IWRITE)
    manifest = _load_manifest()
    manifest.pop(filename, None)
    _save_manifest(manifest)
