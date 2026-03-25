import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://avszyktedjcgpicksujr.supabase.co")
# The Python supabase library requires the classic JWT anon key (starts with eyJ...).
# Get it from: Supabase Dashboard → Project Settings → API → anon/public key
# Set via env var: set SUPABASE_KEY=eyJ...
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Safe sandbox directories — never touch real user files outside these
SANDBOX_DIR = os.path.join(os.path.dirname(__file__), "sandbox")
BACKUP_DIR  = os.path.join(os.path.dirname(__file__), "backups")
QUARANTINE_DIR = os.path.join(os.path.dirname(__file__), "quarantine")

THREAT_SCORE_THRESHOLD = 70

# Scoring weights
SCORE_RAPID_MODIFY = 30
SCORE_HIGH_ENTROPY = 40
SCORE_CANARY_HIT   = 100
