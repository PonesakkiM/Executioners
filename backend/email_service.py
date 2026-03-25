"""
Email Service — SentinelShield AI
Sends automatic alerts via Gmail SMTP for:
  1. Unauthorized login attempts → admin
  2. Ransomware attack detected  → affected user + admin
  3. Recovery complete           → affected user
"""
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587
SENDER_EMAIL  = "sahackathon123@gmail.com"
SENDER_PASS   = "aiihsjzdoewunpjo"   # App password (spaces removed)
ADMIN_EMAIL   = "sahackathon123@gmail.com"

def _send(to: list, subject: str, html: str):
    """Send email in a background thread so it never blocks the API."""
    def _do():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = f"SentinelShield AI <{SENDER_EMAIL}>"
            msg["To"]      = ", ".join(to)
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
                s.ehlo()
                s.starttls()
                s.login(SENDER_EMAIL, SENDER_PASS)
                s.sendmail(SENDER_EMAIL, to, msg.as_string())
            print(f"[Email] Sent '{subject}' → {to}")
        except Exception as e:
            print(f"[Email] FAILED '{subject}': {e}")
    threading.Thread(target=_do, daemon=True).start()

def _base(title: str, color: str, body: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;background:#050d1a;padding:40px 0;min-height:100vh">
      <div style="max-width:560px;margin:0 auto;background:#0a1628;border-radius:16px;overflow:hidden;border:1px solid #1a2d4a">
        <div style="background:{color}18;padding:28px 32px;border-bottom:1px solid #1a2d4a;text-align:center">
          <div style="display:inline-block;background:{color}20;border:1px solid {color}40;border-radius:12px;padding:12px 16px;margin-bottom:12px">
            <span style="font-size:28px">🛡️</span>
          </div>
          <h1 style="color:{color};margin:0;font-size:20px;font-weight:700">SentinelShield AI</h1>
          <p style="color:#4a6080;margin:4px 0 0;font-size:13px">Ransomware Defense Platform</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#ffffff;margin:0 0 16px;font-size:18px">{title}</h2>
          {body}
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #1a2d4a;text-align:center">
            <p style="color:#2a3d55;font-size:11px;margin:0">
              © 2026 SentinelShield Technologies · This is an automated security alert
            </p>
          </div>
        </div>
      </div>
    </div>"""

def _row(label: str, value: str, color: str = "#8ba0b8") -> str:
    return f"""
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a2d4a">
      <span style="color:#4a6080;font-size:13px">{label}</span>
      <span style="color:{color};font-size:13px;font-weight:600">{value}</span>
    </div>"""

# ── 1. Unauthorized login attempt ─────────────────────────────────────────────

def send_unauthorized_login(attempted_email: str, ip: str = "Unknown"):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    body = f"""
    <div style="background:#FF3B3B18;border:1px solid #FF3B3B40;border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:#FF3B3B;font-weight:700;margin:0 0 4px;font-size:14px">⚠ Unauthorized Access Attempt</p>
      <p style="color:#8ba0b8;font-size:13px;margin:0">Someone outside the organisation tried to log in.</p>
    </div>
    {_row("Attempted Email", attempted_email, "#FF3B3B")}
    {_row("Time", now)}
    {_row("IP Address", ip)}
    {_row("Status", "BLOCKED — Not an authorised user", "#FF3B3B")}
    <div style="margin-top:20px;background:#0d1f35;border-radius:8px;padding:14px">
      <p style="color:#4a6080;font-size:12px;margin:0">
        If this was a legitimate employee, add their credentials to the system.
        If this looks suspicious, consider reviewing your security policies.
      </p>
    </div>"""
    html = _base("Unauthorised Login Attempt Detected", "#FF3B3B", body)
    _send([ADMIN_EMAIL], "🚨 [SentinelShield] Unauthorised Login Attempt", html)

# ── 2. Ransomware attack alert → user + admin ─────────────────────────────────

def send_ransomware_alert(user_email: str, user_name: str, attacked_files: list):
    now  = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    flist = "".join(
        f'<div style="padding:6px 10px;background:#FF3B3B10;border-left:3px solid #FF3B3B;margin:4px 0;border-radius:4px">'
        f'<span style="color:#FF3B3B;font-size:12px;font-family:monospace">{f}</span></div>'
        for f in (attacked_files[:10] if attacked_files else ["Unknown files"])
    )
    body = f"""
    <div style="background:#FF3B3B18;border:1px solid #FF3B3B40;border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:#FF3B3B;font-weight:700;margin:0 0 4px;font-size:14px">🔴 RANSOMWARE ATTACK DETECTED</p>
      <p style="color:#8ba0b8;font-size:13px;margin:0">Your files have been encrypted by ransomware activity.</p>
    </div>
    {_row("Affected User", user_name)}
    {_row("User Email", user_email)}
    {_row("Detection Time", now)}
    {_row("Files Affected", str(len(attacked_files)), "#FF3B3B")}
    <div style="margin-top:16px">
      <p style="color:#4a6080;font-size:12px;margin:0 0 8px">Encrypted files:</p>
      {flist}
    </div>
    <div style="margin-top:20px;background:#00FFB218;border:1px solid #00FFB240;border-radius:8px;padding:14px">
      <p style="color:#00FFB2;font-weight:700;font-size:13px;margin:0 0 6px">✓ SentinelShield Response</p>
      <p style="color:#8ba0b8;font-size:12px;margin:0">
        Threat has been detected and containment is in progress.
        Files are being restored from the latest clean snapshot.
        No action required from you — our system is handling recovery.
      </p>
    </div>"""
    html = _base("Ransomware Attack Alert", "#FF3B3B", body)
    recipients = list({user_email, ADMIN_EMAIL})
    _send(recipients, f"🔴 [SentinelShield] Ransomware Attack on {user_name}'s Files", html)

# ── 3. Recovery complete → user ───────────────────────────────────────────────

def send_recovery_complete(user_email: str, user_name: str, restored_files: list, snapshot_id: str):
    now   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    flist = "".join(
        f'<div style="padding:6px 10px;background:#00FFB210;border-left:3px solid #00FFB2;margin:4px 0;border-radius:4px">'
        f'<span style="color:#00FFB2;font-size:12px;font-family:monospace">{f}</span></div>'
        for f in (restored_files[:10] if restored_files else ["All files"])
    )
    body = f"""
    <div style="background:#00FFB218;border:1px solid #00FFB240;border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:#00FFB2;font-weight:700;margin:0 0 4px;font-size:14px">✅ Recovery Complete</p>
      <p style="color:#8ba0b8;font-size:13px;margin:0">Your files have been successfully restored from a clean backup.</p>
    </div>
    {_row("User", user_name)}
    {_row("Recovery Time", now)}
    {_row("Files Restored", str(len(restored_files)), "#00FFB2")}
    {_row("Restored From", snapshot_id, "#2F80ED")}
    <div style="margin-top:16px">
      <p style="color:#4a6080;font-size:12px;margin:0 0 8px">Restored files:</p>
      {flist}
    </div>
    <div style="margin-top:20px;background:#0d1f35;border-radius:8px;padding:14px">
      <p style="color:#4a6080;font-size:12px;margin:0">
        Your system is now secure. SentinelShield has redeployed canary files
        and reset the threat score. Please review the incident in your dashboard.
      </p>
    </div>"""
    html = _base("File Recovery Complete", "#00FFB2", body)
    _send([user_email, ADMIN_EMAIL], f"✅ [SentinelShield] Recovery Complete for {user_name}", html)
