from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

_client = None
_db_available = False

def get_db():
    global _client, _db_available
    if _client is None and SUPABASE_KEY:
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
            _db_available = True
        except Exception as e:
            print(f"[DB] Supabase init failed: {e}")
            _db_available = False
    return _client if _db_available else None

def log_threat_event(event_type: str, threat_score: int, affected_files: list, action_taken: str = ""):
    db = get_db()
    if not db:
        return
    try:
        db.table("threat_events").insert({
            "event_type": event_type,
            "threat_score": threat_score,
            "affected_files": affected_files,
            "action_taken": action_taken,
        }).execute()
    except Exception as e:
        print(f"[DB] Failed to log threat event: {e}")

def log_backup_snapshot(snapshot_id: str, file_count: int, restore_status: str = "available"):
    db = get_db()
    if not db:
        return
    try:
        db.table("backup_snapshots").insert({
            "snapshot_id": snapshot_id,
            "file_count": file_count,
            "restore_status": restore_status,
        }).execute()
    except Exception as e:
        print(f"[DB] Failed to log snapshot: {e}")

def update_snapshot_status(snapshot_id: str, status: str):
    db = get_db()
    if not db:
        return
    try:
        db.table("backup_snapshots").update({"restore_status": status}).eq("snapshot_id", snapshot_id).execute()
    except Exception as e:
        print(f"[DB] Failed to update snapshot: {e}")

def log_monitored_path(path: str, added_by: str = "user"):
    db = get_db()
    if not db:
        return
    try:
        db.table("monitored_paths").upsert({
            "path": path,
            "added_by_user": added_by,
            "monitoring_status": "active",
        }).execute()
    except Exception as e:
        print(f"[DB] Failed to log monitored path: {e}")

def get_threat_events(limit: int = 50):
    db = get_db()
    if not db:
        return []
    try:
        res = db.table("threat_events").select("*").order("timestamp", desc=True).limit(limit).execute()
        return res.data
    except Exception as e:
        print(f"[DB] Failed to fetch events: {e}")
        return []

def get_snapshots():
    db = get_db()
    if not db:
        return []
    try:
        res = db.table("backup_snapshots").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"[DB] Failed to fetch snapshots: {e}")
        return []
