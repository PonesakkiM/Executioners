"""
Prevention Engine — Three active countermeasures:

1. Folder Lockdown   — make sandbox read-only when exfiltration detected
2. Process Kill      — terminate the process doing the copying
3. AES Encryption    — encrypt files at rest so copied data is unreadable
"""
import os
import stat
import threading
import psutil
from cryptography.fernet import Fernet
from db import log_threat_event
from config import SANDBOX_DIR

# ── AES key management ────────────────────────────────────────────────────────
_KEY_FILE = os.path.join(os.path.dirname(__file__), "..", ".sentinel_key")

def _get_or_create_key() -> bytes:
    if os.path.exists(_KEY_FILE):
        with open(_KEY_FILE, "rb") as f:
            return f.read()
    key = Fernet.generate_key()
    with open(_KEY_FILE, "wb") as f:
        f.write(key)
    os.chmod(_KEY_FILE, stat.S_IREAD)  # read-only
    return key

_fernet = None

def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_get_or_create_key())
    return _fernet

# ── Prevention state ──────────────────────────────────────────────────────────
prevention_state = {
    "folder_locked":      False,
    "processes_killed":   [],
    "files_encrypted":    [],
    "files_decrypted":    [],
    "active":             False,
    "events":             [],
}

def _push(msg: str):
    prevention_state["events"].insert(0, msg)
    prevention_state["events"] = prevention_state["events"][:20]
    print(f"[Prevention] {msg}")

# ── 1. Folder Lockdown ────────────────────────────────────────────────────────

def lock_sandbox():
    """Make all files in sandbox read-only — stops further copying."""
    locked = []
    for fname in os.listdir(SANDBOX_DIR):
        fpath = os.path.join(SANDBOX_DIR, fname)
        if os.path.isfile(fpath):
            try:
                os.chmod(fpath, stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
                locked.append(fname)
            except Exception as e:
                _push(f"Could not lock {fname}: {e}")
    prevention_state["folder_locked"] = True
    _push(f"Folder locked — {len(locked)} files set read-only")
    log_threat_event("folder_locked", 0, locked, "exfiltration_countermeasure_lockdown")
    return locked

def unlock_sandbox():
    """Restore write permissions after threat is cleared."""
    for fname in os.listdir(SANDBOX_DIR):
        fpath = os.path.join(SANDBOX_DIR, fname)
        if os.path.isfile(fpath):
            try:
                os.chmod(fpath, stat.S_IREAD | stat.S_IWRITE | stat.S_IRGRP | stat.S_IROTH)
            except Exception:
                pass
    prevention_state["folder_locked"] = False
    _push("Folder unlocked — write permissions restored")

# ── 2. Process Termination ────────────────────────────────────────────────────

def kill_exfil_processes(keywords: list = None) -> list:
    """
    Terminate processes that are likely doing the exfiltration.
    In demo: kills processes matching simulation keywords.
    In production: would use process handle tracking.
    """
    if keywords is None:
        keywords = ["simulate_exfil", "exfil_sim", "robocopy", "xcopy", "rclone"]
    killed = []
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            cmdline = " ".join(proc.info.get("cmdline") or []).lower()
            name    = (proc.info.get("name") or "").lower()
            if any(k in cmdline or k in name for k in keywords):
                proc.kill()
                killed.append({"pid": proc.pid, "name": proc.info["name"]})
                _push(f"Process killed: {proc.info['name']} (PID {proc.pid})")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    prevention_state["processes_killed"].extend(killed)
    log_threat_event("exfil_process_killed", 0,
                     [p["name"] for p in killed], f"killed {len(killed)} processes")
    return killed

# ── 3. AES Encryption at Rest ─────────────────────────────────────────────────

def encrypt_file(filepath: str) -> bool:
    """
    Encrypt a file with AES (Fernet = AES-128-CBC + HMAC).
    Encrypted file gets .enc extension.
    Even if attacker copies it, they can't read it without the key.
    """
    if filepath.endswith(".enc") or filepath.endswith(".locked"):
        return False
    try:
        with open(filepath, "rb") as f:
            data = f.read()
        encrypted = _get_fernet().encrypt(data)
        enc_path = filepath + ".enc"
        with open(enc_path, "wb") as f:
            f.write(encrypted)
        os.remove(filepath)
        _push(f"Encrypted at rest: {os.path.basename(filepath)}")
        return True
    except Exception as e:
        _push(f"Encrypt failed {os.path.basename(filepath)}: {e}")
        return False

def decrypt_file(filepath: str) -> bool:
    """Decrypt a .enc file back to original."""
    if not filepath.endswith(".enc"):
        return False
    try:
        with open(filepath, "rb") as f:
            data = f.read()
        decrypted = _get_fernet().decrypt(data)
        orig_path = filepath[:-4]  # remove .enc
        with open(orig_path, "wb") as f:
            f.write(decrypted)
        os.remove(filepath)
        _push(f"Decrypted: {os.path.basename(orig_path)}")
        return True
    except Exception as e:
        _push(f"Decrypt failed {os.path.basename(filepath)}: {e}")
        return False

def encrypt_sandbox(skip_canary=True, skip_honeypot=True) -> list:
    """Encrypt all files in sandbox at rest."""
    encrypted = []
    for fname in os.listdir(SANDBOX_DIR):
        if skip_canary  and fname.startswith("_sentinelshield"): continue
        if skip_honeypot and fname.startswith("_honeypot"):       continue
        if fname.endswith(".enc") or fname.endswith(".locked"):   continue
        fpath = os.path.join(SANDBOX_DIR, fname)
        if os.path.isfile(fpath):
            if encrypt_file(fpath):
                encrypted.append(fname)
    prevention_state["files_encrypted"].extend(encrypted)
    log_threat_event("files_encrypted_at_rest", 0, encrypted,
                     f"AES encryption applied to {len(encrypted)} files")
    _push(f"AES encryption complete — {len(encrypted)} files protected")
    return encrypted

def decrypt_sandbox() -> list:
    """Decrypt all .enc files in sandbox."""
    decrypted = []
    for fname in os.listdir(SANDBOX_DIR):
        if fname.endswith(".enc"):
            fpath = os.path.join(SANDBOX_DIR, fname)
            if decrypt_file(fpath):
                decrypted.append(fname.replace(".enc", ""))
    prevention_state["files_decrypted"].extend(decrypted)
    log_threat_event("files_decrypted", 0, decrypted, "AES decryption applied")
    _push(f"Decryption complete — {len(decrypted)} files restored")
    return decrypted

# ── Full response workflow ────────────────────────────────────────────────────

def run_exfil_response():
    """
    Full automated response when exfiltration is detected:
    1. Lock folder immediately
    2. Kill suspicious processes
    3. Log everything
    """
    prevention_state["active"] = True
    _push("Exfiltration response triggered")
    locked   = lock_sandbox()
    killed   = kill_exfil_processes()
    _push(f"Response complete — {len(locked)} files locked, {len(killed)} processes killed")
    return {"locked": locked, "killed": killed}

def reset_prevention():
    unlock_sandbox()
    prevention_state["folder_locked"]    = False
    prevention_state["processes_killed"] = []
    prevention_state["files_encrypted"]  = []
    prevention_state["files_decrypted"]  = []
    prevention_state["active"]           = False
    prevention_state["events"]           = []
