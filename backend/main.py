import os
import sys
import shutil
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional

from config import SANDBOX_DIR, BACKUP_DIR, QUARANTINE_DIR
from db import get_threat_events, get_snapshots, log_threat_event
from engines.canary import deploy_canary
from engines.backup import create_snapshot, restore_snapshot, list_snapshots, list_quarantine
from monitor import state, start_monitoring, stop_monitoring, reset_threat_score, terminate_suspicious_processes
from simulator import run_simulation
from employees import authenticate, is_known_email, get_all_employees
from email_service import send_unauthorized_login, send_ransomware_alert, send_recovery_complete

app = FastAPI(title="SentinelShield AI", version="2.4.1-beta")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup: init sandbox and start monitoring ──────────────────────────────

@app.on_event("startup")
def startup():
    for d in [SANDBOX_DIR, BACKUP_DIR, QUARANTINE_DIR]:
        os.makedirs(d, exist_ok=True)

    # Seed sandbox with demo files if they don't exist
    demo_files = {
        "report_q1.docx":             "SentinelShield demo file: report_q1.docx\n" * 20,
        "employee_data.csv":          "id,name,dept\n1,Alice,Engineering\n2,Bob,Finance\n3,Carol,HR\n" * 10,
        "budget_2025.xlsx":           "Q1: $1.2M\nQ2: $1.4M\nQ3: $1.6M\nQ4: $1.8M\nTotal: $6.0M\n" * 10,
        "contracts.pdf":              "CONTRACT: Service Agreement 2025\nParty A: SentinelShield\nParty B: Client Corp\n" * 10,
        "network_config.txt":         "host=10.0.1.1\ngateway=10.0.0.1\ndns=8.8.8.8\nsubnet=255.255.255.0\n" * 10,
        "employee_records.csv":       "emp_id,name,role,salary\nEMP001,Alex,Admin,95000\nEMP002,Sarah,Analyst,72000\n" * 10,
        "financial_report_q4.txt":    "Q4 Revenue: $7.74M\nExpenses: $5.71M\nNet Income: $2.03M\n" * 10,
        "customer_database.csv":      "cust_id,company,value\nC001,Acme,48000\nC002,GlobalTech,24000\n" * 10,
        "network_topology.txt":       "10.0.1.0/24 Corporate\n10.0.2.0/24 Engineering\n10.0.3.0/24 Finance\n" * 10,
        "backup_policy.txt":          "Full backup: Sunday 02:00\nIncremental: Daily 02:00\nRTO: 4 hours\nRPO: 30 min\n" * 10,
        "source_code_credentials.txt":"DB_HOST=db.internal\nDB_USER=app_user\nDB_PASS=[REDACTED]\n" * 10,
        "project_roadmap.txt":        "Q1: Dashboard v2.4\nQ2: AI threat prediction\nQ3: Cloud module\nQ4: Autonomous response\n" * 10,
        "incident_report_2025.txt":   "INC-2025-0847\nSeverity: HIGH\nStatus: RESOLVED\nRTO: 17 seconds\n" * 10,
    }
    for fname, content in demo_files.items():
        p = os.path.join(SANDBOX_DIR, fname)
        if not os.path.exists(p):
            with open(p, "w", encoding="utf-8") as f:
                f.write(content)

    deploy_canary(SANDBOX_DIR)
    start_monitoring([SANDBOX_DIR])
    create_snapshot(SANDBOX_DIR)
    print("[SentinelShield] Backend ready.")

# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    ip: Optional[str] = "Unknown"

@app.post("/auth/login")
def login(req: LoginRequest):
    user = authenticate(req.email, req.password)
    if user:
        log_threat_event("user_login", 0, [], f"{user['name']} ({user['role']}) logged in")
        return {"success": True, "user": user}
    # Unknown email → send alert to admin
    if not is_known_email(req.email):
        send_unauthorized_login(req.email, req.ip)
        log_threat_event("unauthorized_login_attempt", 0, [req.email], f"unknown_email={req.email}")
    return {"success": False, "error": "Invalid credentials"}

@app.get("/auth/employees")
def employees():
    return get_all_employees()

# ── Active session store (in-memory for demo) ─────────────────────────────────
_active_user: dict = {}

@app.post("/auth/session")
def set_session(user: dict):
    """Store the currently logged-in user for email targeting."""
    global _active_user
    _active_user = user
    return {"ok": True}

@app.get("/auth/session")
def get_session():
    return _active_user

@app.get("/status")
def get_status():
    from engines.canary import CANARY_FILENAME, CANARY_CONTENT
    canary_path = os.path.join(SANDBOX_DIR, CANARY_FILENAME)
    canary_intact = False
    if os.path.exists(canary_path):
        try:
            with open(canary_path, "r") as f:
                content = f.read()
            canary_intact = content.strip() == CANARY_CONTENT.strip()
        except Exception:
            canary_intact = False

    return {
        "status": state["status"],
        "threat_score": state["threat_score"],
        "canary_hit": state["canary_hit"],
        "canary_intact": canary_intact,
        "monitored_paths": state["monitored_paths"],
        "recent_events": state["recent_events"][:20],
    }

# ── Threat Events ─────────────────────────────────────────────────────────────

@app.get("/threat-events")
def threat_events(limit: int = 50):
    return get_threat_events(limit)

# ── Monitored Paths ───────────────────────────────────────────────────────────

class PathRequest(BaseModel):
    path: str

@app.post("/paths/add")
def add_path(req: PathRequest):
    if not os.path.exists(req.path):
        raise HTTPException(400, f"Path does not exist: {req.path}")
    deploy_canary(req.path)
    start_monitoring(state["monitored_paths"] + [req.path])
    return {"added": req.path, "monitored": state["monitored_paths"]}

@app.get("/paths")
def get_paths():
    return {"paths": state["monitored_paths"]}

# ── Snapshots ─────────────────────────────────────────────────────────────────

@app.post("/snapshot")
def take_snapshot():
    result = create_snapshot(SANDBOX_DIR)
    return result

@app.get("/snapshots")
def snapshots():
    db_snaps = get_snapshots()
    local = list_snapshots()
    return {"db": db_snaps, "local": local}

# ── List files inside a specific snapshot ─────────────────────────────────────

@app.get("/snapshots/{snapshot_id}/files")
def snapshot_files(snapshot_id: str):
    snap_dir = os.path.join(BACKUP_DIR, snapshot_id)
    if not os.path.exists(snap_dir):
        raise HTTPException(404, f"Snapshot {snapshot_id} not found")
    files = []
    for fname in sorted(os.listdir(snap_dir)):
        fpath = os.path.join(snap_dir, fname)
        if os.path.isfile(fpath):
            stat = os.stat(fpath)
            is_locked = fname.endswith(".locked")
            is_canary = fname.startswith("_sentinelshield")
            files.append({
                "name":      fname,
                "size":      stat.st_size,
                "is_locked": is_locked,
                "is_canary": is_canary,
                "status":    "encrypted" if is_locked else ("canary" if is_canary else "clean"),
            })
    clean = [f for f in files if f["status"] == "clean"]
    return {
        "snapshot_id": snapshot_id,
        "files":       files,
        "clean_count": len(clean),
        "total":       len(files),
    }

@app.post("/restore/{snapshot_id}")
def restore(snapshot_id: str):
    result = restore_snapshot(snapshot_id, SANDBOX_DIR)
    reset_threat_score()
    log_threat_event("recovery_complete", 0, result.get("restored_files", []), "system_restored")
    user = _active_user
    if user:
        send_recovery_complete(
            user_email=user.get("email", "sahackathon123@gmail.com"),
            user_name=user.get("name", "User"),
            restored_files=result.get("restored_files", []),
            snapshot_id=snapshot_id,
        )
    return result

# ── Quarantine ────────────────────────────────────────────────────────────────

@app.get("/quarantine")
def quarantine():
    return {"files": list_quarantine()}

# ── Simulate Attack ───────────────────────────────────────────────────────────

@app.post("/simulate-attack")
def simulate_attack():
    def _after_attack():
        import time; time.sleep(6)
        attacked = [f for f in os.listdir(SANDBOX_DIR) if f.endswith(".locked")]
        user = _active_user if _active_user else {"email": "sahackathon123@gmail.com", "name": "System User"}
        send_ransomware_alert(
            user_email=user.get("email", "sahackathon123@gmail.com"),
            user_name=user.get("name", "User"),
            attacked_files=attacked,
        )
    import threading
    run_simulation()
    threading.Thread(target=_after_attack, daemon=True).start()
    return {"status": "simulation_started", "sandbox": SANDBOX_DIR}

# ── Containment ───────────────────────────────────────────────────────────────

@app.post("/contain")
def contain():
    killed = terminate_suspicious_processes()
    reset_threat_score()
    # Re-deploy a fresh canary after containment
    deploy_canary(SANDBOX_DIR)
    log_threat_event("containment_complete", 0, [], "threat_score_reset_canary_redeployed")
    return {"contained": True, "processes_killed": killed}

# ── Reset (manual) ────────────────────────────────────────────────────────────

@app.post("/reset")
def reset():
    """Manually reset threat score and redeploy canary."""
    reset_threat_score()
    deploy_canary(SANDBOX_DIR)
    return {"reset": True}

# ── System Hardening Info (Layer 2) ──────────────────────────────────────────

@app.get("/system-hardening")
def system_hardening():
    import datetime
    return {
        "last_os_update_check": datetime.datetime.utcnow().isoformat() + "Z",
        "antivirus_status": "active",
        "email_filtering": "protected",
        "firewall": "enabled",
    }

# ── List sandbox files ────────────────────────────────────────────────────────

@app.get("/files")
def list_files():
    """List all files currently in the sandbox with metadata."""
    files = []
    for fname in sorted(os.listdir(SANDBOX_DIR)):
        fpath = os.path.join(SANDBOX_DIR, fname)
        if not os.path.isfile(fpath):
            continue
        stat = os.stat(fpath)
        is_locked   = fname.endswith(".locked")
        is_canary   = fname.startswith("_sentinelshield")
        is_attacked = is_locked
        files.append({
            "name":       fname,
            "path":       fpath,
            "size":       stat.st_size,
            "modified":   stat.st_mtime,
            "is_locked":  is_locked,
            "is_canary":  is_canary,
            "is_attacked": is_attacked,
            "status":     "encrypted" if is_locked else ("canary" if is_canary else "normal"),
        })
    return {"files": files, "sandbox": SANDBOX_DIR}

# ── Read file content ─────────────────────────────────────────────────────────

@app.get("/files/{filename}/content")
def file_content(filename: str):
    """Return readable content. For .locked files, also returns the original from latest snapshot."""
    fpath = os.path.join(SANDBOX_DIR, filename)
    if not os.path.exists(fpath):
        raise HTTPException(404, "File not found")

    is_locked = filename.endswith(".locked")
    original_name = filename.replace(".locked", "") if is_locked else filename

    # Current (possibly encrypted) content
    try:
        with open(fpath, "rb") as f:
            raw = f.read(8192)
        if is_locked:
            # Show hex representation of encrypted bytes — meaningful for demo
            hex_lines = []
            for i in range(0, min(len(raw), 512), 16):
                chunk = raw[i:i+16]
                hex_part = " ".join(f"{b:02x}" for b in chunk)
                ascii_part = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
                hex_lines.append(f"{i:04x}  {hex_part:<48}  {ascii_part}")
            current_content = "\n".join(hex_lines)
            current_readable = False
        else:
            current_content = raw.decode("utf-8", errors="replace")
            current_readable = True
    except Exception as e:
        current_content = f"[Error reading file: {e}]"
        current_readable = False

    # Original content from most recent snapshot
    original_content = None
    original_snapshot = None
    snapshots_local = list_snapshots()
    # Sort by name descending (snap_<timestamp>_xxx) to get latest first
    for snap_id in sorted(snapshots_local, reverse=True):
        snap_path = os.path.join(BACKUP_DIR, snap_id, original_name)
        if os.path.exists(snap_path):
            try:
                with open(snap_path, "r", errors="replace") as f:
                    original_content = f.read(8192)
                original_snapshot = snap_id
                break
            except Exception:
                pass

    return {
        "filename":          filename,
        "original_name":     original_name,
        "is_locked":         is_locked,
        "current_content":   current_content,
        "current_readable":  current_readable,
        "original_content":  original_content,
        "original_snapshot": original_snapshot,
        "truncated":         os.path.getsize(fpath) > 8192,
        "size":              os.path.getsize(fpath),
    }

# ── File diff: compare current vs snapshot ────────────────────────────────────

@app.get("/files/{filename}/diff/{snapshot_id}")
def file_diff(filename: str, snapshot_id: str):
    """Compare current sandbox file vs snapshot version. Handles .locked files."""
    import difflib

    original_name = filename.replace(".locked", "")
    current_path  = os.path.join(SANDBOX_DIR, filename)

    # Find snapshot file — try original name (pre-encryption)
    snapshot_path = os.path.join(BACKUP_DIR, snapshot_id, original_name)
    if not os.path.exists(snapshot_path):
        snapshot_path = os.path.join(BACKUP_DIR, snapshot_id, filename)

    before_lines, after_lines = [], []
    before_content, after_content = "", ""

    if os.path.exists(snapshot_path):
        with open(snapshot_path, "r", errors="replace") as f:
            before_content = f.read(8192)
            before_lines = before_content.splitlines(keepends=True)[:100]

    if os.path.exists(current_path):
        if filename.endswith(".locked"):
            # For encrypted files, decode XOR to show what it looks like
            with open(current_path, "rb") as f:
                raw = f.read(8192)
            # Try XOR decode (key 0xAB used in simulator)
            decoded = bytes(b ^ 0xAB for b in raw)
            try:
                after_content = decoded.decode("utf-8", errors="replace")
            except Exception:
                after_content = "[Binary content — XOR encrypted]"
            after_lines = after_content.splitlines(keepends=True)[:100]
        else:
            with open(current_path, "r", errors="replace") as f:
                after_content = f.read(8192)
            after_lines = after_content.splitlines(keepends=True)[:100]

    diff = list(difflib.unified_diff(
        before_lines, after_lines,
        fromfile=f"BEFORE (snapshot) / {original_name}",
        tofile=f"AFTER (attacked) / {filename}",
        lineterm=""
    ))

    return {
        "filename":       filename,
        "original_name":  original_name,
        "snapshot_id":    snapshot_id,
        "before_lines":   before_lines,
        "after_lines":    after_lines,
        "before_content": before_content,
        "after_content":  after_content,
        "diff":           diff,
        "changed":        len(diff) > 0,
        "before_size":    os.path.getsize(snapshot_path) if os.path.exists(snapshot_path) else 0,
        "after_size":     os.path.getsize(current_path)  if os.path.exists(current_path)  else 0,
        "is_locked":      filename.endswith(".locked"),
    }

# ── Attack detail ─────────────────────────────────────────────────────────────

@app.get("/attack-detail")
def attack_detail():
    """Return details about the current/last attack: what happened, where, how."""
    attacked_files = []
    for fname in os.listdir(SANDBOX_DIR):
        if fname.endswith(".locked"):
            fpath = os.path.join(SANDBOX_DIR, fname)
            attacked_files.append({
                "name":     fname,
                "original": fname.replace(".locked", ""),
                "path":     fpath,
                "size":     os.path.getsize(fpath),
            })

    quarantined = list_quarantine()

    return {
        "attack_vector":    "Behavioral ransomware simulation via XOR encryption + .locked rename",
        "attack_location":  SANDBOX_DIR,
        "method":           "Rapid file modification → entropy spike → file encryption → rename",
        "steps": [
            "1. Malicious process rapidly modified target files (4x writes in <2s)",
            "2. File entropy spiked above 7.5 bits (XOR encryption applied)",
            "3. Files renamed with .locked extension",
            "4. Canary file access triggered critical alert",
            "5. Threat score exceeded threshold → containment triggered",
        ],
        "attacked_files":   attacked_files,
        "quarantined_files": quarantined,
        "total_affected":   len(attacked_files) + len(quarantined),
    }

# ── Quarantine ALL attacked (.locked) files at once ──────────────────────────

@app.post("/quarantine-attacked")
def quarantine_attacked():
    """Move all .locked files from sandbox to quarantine in one shot."""
    from engines.backup import quarantine_file
    moved = []
    for fname in os.listdir(SANDBOX_DIR):
        if fname.endswith(".locked"):
            fpath = os.path.join(SANDBOX_DIR, fname)
            quarantine_file(fpath)
            moved.append(fname)
    log_threat_event("bulk_quarantine", 0, moved, f"quarantined {len(moved)} attacked files")
    return {"quarantined": moved, "count": len(moved)}

# ── Quarantine a specific file ────────────────────────────────────────────────

@app.post("/quarantine/{filename}")
def quarantine_file_endpoint(filename: str):
    from engines.backup import quarantine_file
    fpath = os.path.join(SANDBOX_DIR, filename)
    if not os.path.exists(fpath):
        raise HTTPException(404, "File not found in sandbox")
    dest = quarantine_file(fpath)
    return {"quarantined": filename, "moved_to": dest}

# ── Delete quarantine file ────────────────────────────────────────────────────

@app.delete("/quarantine/{filename}")
def delete_quarantine_file(filename: str):
    fpath = os.path.join(QUARANTINE_DIR, filename)
    if os.path.exists(fpath):
        os.remove(fpath)
        log_threat_event("file_deleted", 0, [filename], "permanently_deleted")
    return {"deleted": filename}

# ── Restore quarantine file to sandbox ───────────────────────────────────────

@app.post("/quarantine/{filename}/restore")
def restore_quarantine_file(filename: str):
    src = os.path.join(QUARANTINE_DIR, filename)
    dst = os.path.join(SANDBOX_DIR, filename)
    if not os.path.exists(src):
        raise HTTPException(404, "File not found in quarantine")
    shutil.move(src, dst)
    log_threat_event("file_restored_from_quarantine", 0, [filename], "moved_back_to_sandbox")
    return {"restored": filename, "to": dst}
