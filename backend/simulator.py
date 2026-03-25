"""
Ransomware Attack Simulator (Demo Only)
Simulates ransomware behavior in the sandbox directory ONLY.
Sequence:
  1. Rapidly modify normal files (behavioral score +30 each)
  2. XOR-encrypt files (entropy spike, score +40 each)
  3. Rename with .locked extension (rename pattern, score +50)
  4. Touch the canary file last (score +100, triggers critical alert)
"""
import os
import time
import threading
from config import SANDBOX_DIR
from engines.canary import CANARY_FILENAME

def _xor_encrypt(data: bytes, key: int = 0xAB) -> bytes:
    return bytes(b ^ key for b in data)

def run_simulation(on_event=None):
    def _notify(msg):
        print(f"[Sim] {msg}")
        if on_event:
            on_event(msg)

    def _attack():
        _notify("Attack simulation started")

        # Target only clean files (not already locked, not canary)
        files = [f for f in os.listdir(SANDBOX_DIR)
                 if os.path.isfile(os.path.join(SANDBOX_DIR, f))
                 and not f.startswith("_sentinelshield")
                 and not f.endswith(".locked")]  # never double-lock

        for fname in files[:8]:  # attack up to 8 files for a more visible demo
            path = os.path.join(SANDBOX_DIR, fname)
            try:
                # Step 1: Rapid modifications (triggers behavioral score)
                for _ in range(4):
                    with open(path, "ab") as f:
                        f.write(b"\x00" * 10)
                    time.sleep(0.2)

                # Step 2: XOR encrypt (raises entropy above 7.5)
                with open(path, "rb") as f:
                    data = f.read()
                with open(path, "wb") as f:
                    f.write(_xor_encrypt(data))

                # Step 3: Rename with .locked
                locked = path + ".locked"
                os.rename(path, locked)
                _notify(f"Encrypted: {fname} → {fname}.locked")
                time.sleep(0.3)

            except Exception as e:
                _notify(f"Error on {fname}: {e}")

        # Step 4: Touch the canary file — this is what real ransomware does
        # and what triggers the critical alert in SentinelShield
        time.sleep(0.5)
        canary_path = os.path.join(SANDBOX_DIR, CANARY_FILENAME)
        if os.path.exists(canary_path):
            try:
                with open(canary_path, "a") as f:
                    f.write("\n[RANSOMWARE WAS HERE]")
                _notify(f"Canary file touched: {CANARY_FILENAME} — CRITICAL ALERT TRIGGERED")
            except Exception as e:
                _notify(f"Could not touch canary: {e}")

        _notify("Attack simulation complete — containment should trigger now")

    t = threading.Thread(target=_attack, daemon=True)
    t.start()
    return {"status": "simulation_started", "target": SANDBOX_DIR}
