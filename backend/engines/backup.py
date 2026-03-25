"""
Backup and Recovery Engine
Simulates immutable snapshots:
  - Copies monitored files to /backend/backups/<snapshot_id>/
  - Marks backup files read-only
  - Restores from snapshot on demand
"""
import os
import shutil
import stat
import uuid
import time
from db import log_backup_snapshot, update_snapshot_status, log_threat_event
from config import BACKUP_DIR, QUARANTINE_DIR

def _make_readonly(path: str):
    os.chmod(path, stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)

def _make_writable(path: str):
    os.chmod(path, stat.S_IREAD | stat.S_IWRITE | stat.S_IRGRP | stat.S_IROTH)

def create_snapshot(source_dir: str) -> dict:
    """Create an immutable snapshot of source_dir."""
    snapshot_id = f"snap_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    dest = os.path.join(BACKUP_DIR, snapshot_id)
    os.makedirs(dest, exist_ok=True)

    files_copied = []
    for fname in os.listdir(source_dir):
        src_path = os.path.join(source_dir, fname)
        if os.path.isfile(src_path):
            dst_path = os.path.join(dest, fname)
            shutil.copy2(src_path, dst_path)
            _make_readonly(dst_path)
            files_copied.append(fname)

    log_backup_snapshot(snapshot_id, len(files_copied))
    log_threat_event("snapshot_created", 0, files_copied, f"snapshot_id={snapshot_id}")
    print(f"[Backup] Snapshot created: {snapshot_id} ({len(files_copied)} files)")
    return {"snapshot_id": snapshot_id, "file_count": len(files_copied), "path": dest}

def restore_snapshot(snapshot_id: str, target_dir: str) -> dict:
    """Restore files from a snapshot back to target_dir."""
    src = os.path.join(BACKUP_DIR, snapshot_id)
    if not os.path.exists(src):
        return {"error": f"Snapshot {snapshot_id} not found"}

    restored = []
    for fname in os.listdir(src):
        src_path = os.path.join(src, fname)
        dst_path = os.path.join(target_dir, fname)
        # Make backup writable temporarily for copy
        _make_writable(src_path)
        shutil.copy2(src_path, dst_path)
        _make_readonly(src_path)  # re-lock backup
        restored.append(fname)

    update_snapshot_status(snapshot_id, "restored")
    log_threat_event("snapshot_restored", 0, restored, f"snapshot_id={snapshot_id}")
    print(f"[Backup] Restored {len(restored)} files from {snapshot_id}")
    return {"snapshot_id": snapshot_id, "restored_files": restored}

def quarantine_file(filepath: str) -> str:
    """Move a suspicious file to quarantine."""
    os.makedirs(QUARANTINE_DIR, exist_ok=True)
    fname = os.path.basename(filepath)
    dest = os.path.join(QUARANTINE_DIR, fname)
    if os.path.exists(filepath):
        shutil.move(filepath, dest)
        log_threat_event("file_quarantined", 0, [filepath], f"moved_to={dest}")
    return dest

def list_snapshots() -> list:
    if not os.path.exists(BACKUP_DIR):
        return []
    return [d for d in os.listdir(BACKUP_DIR) if os.path.isdir(os.path.join(BACKUP_DIR, d))]

def list_quarantine() -> list:
    if not os.path.exists(QUARANTINE_DIR):
        return []
    return os.listdir(QUARANTINE_DIR)
