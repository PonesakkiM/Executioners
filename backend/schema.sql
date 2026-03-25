-- ============================================================
-- SentinelShield AI — Supabase Schema + Seed Data
-- Run this entire file in your Supabase SQL editor
-- ============================================================

-- ── Tables ────────────────────────────────────────────────────

create table if not exists threat_events (
  id             bigserial primary key,
  timestamp      timestamptz default now(),
  event_type     text not null,
  threat_score   integer default 0,
  affected_files jsonb default '[]'::jsonb,
  action_taken   text default ''
);

create table if not exists backup_snapshots (
  snapshot_id    text primary key,
  created_at     timestamptz default now(),
  file_count     integer default 0,
  restore_status text default 'available'
);

create table if not exists monitored_paths (
  path              text primary key,
  added_by_user     text default 'system',
  monitoring_status text default 'active',
  added_at          timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────

alter table threat_events    enable row level security;
alter table backup_snapshots enable row level security;
alter table monitored_paths  enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='threat_events'    and policyname='allow_all_threat_events')    then
    create policy allow_all_threat_events    on threat_events    for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='backup_snapshots' and policyname='allow_all_backup_snapshots') then
    create policy allow_all_backup_snapshots on backup_snapshots for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='monitored_paths'  and policyname='allow_all_monitored_paths')  then
    create policy allow_all_monitored_paths  on monitored_paths  for all using (true) with check (true); end if;
end $$;

-- ── Seed: monitored_paths ─────────────────────────────────────

insert into monitored_paths (path, added_by_user, monitoring_status) values
  ('sandbox/documents',  'system', 'active'),
  ('sandbox/downloads',  'system', 'active'),
  ('sandbox/desktop',    'system', 'active'),
  ('sandbox/finance',    'system', 'active'),
  ('sandbox/hr',         'system', 'active')
on conflict (path) do nothing;

-- ── Seed: backup_snapshots ────────────────────────────────────

insert into backup_snapshots (snapshot_id, created_at, file_count, restore_status) values
  ('snap_demo_001', now() - interval '3 hours',  134, 'available'),
  ('snap_demo_002', now() - interval '2 hours',  138, 'available'),
  ('snap_demo_003', now() - interval '1 hour',   142, 'available'),
  ('snap_demo_004', now() - interval '30 minutes', 142, 'available'),
  ('snap_demo_005', now() - interval '5 minutes',  143, 'available')
on conflict (snapshot_id) do nothing;

-- ── Seed: threat_events ───────────────────────────────────────
-- Simulates a realistic attack timeline

insert into threat_events (timestamp, event_type, threat_score, affected_files, action_taken) values

  -- System startup
  (now() - interval '2 hours',
   'monitoring_started', 0,
   '["sandbox/documents", "sandbox/downloads", "sandbox/desktop"]'::jsonb,
   'watchdog_observer_started'),

  (now() - interval '2 hours' + interval '2 seconds',
   'canary_deployed', 0,
   '["sandbox/_sentinelshield_do_not_touch.txt"]'::jsonb,
   'canary_created'),

  (now() - interval '2 hours' + interval '5 seconds',
   'snapshot_created', 0,
   '["report_q1.docx","employee_data.csv","budget_2025.xlsx","contracts.pdf","network_config.txt"]'::jsonb,
   'snapshot_id=snap_demo_001'),

  -- Normal activity
  (now() - interval '90 minutes',
   'file_modified', 0,
   '["report_q1.docx"]'::jsonb,
   'normal_write'),

  (now() - interval '85 minutes',
   'snapshot_created', 0,
   '["report_q1.docx","employee_data.csv","budget_2025.xlsx","contracts.pdf","network_config.txt"]'::jsonb,
   'snapshot_id=snap_demo_002'),

  -- Attack begins
  (now() - interval '30 minutes',
   'rapid_modification', 30,
   '["budget_2025.xlsx"]'::jsonb,
   'behavioral_flag — 4 writes in 1.2s'),

  (now() - interval '30 minutes' + interval '3 seconds',
   'rapid_modification', 60,
   '["employee_data.csv"]'::jsonb,
   'behavioral_flag — 4 writes in 0.9s'),

  (now() - interval '30 minutes' + interval '6 seconds',
   'high_entropy_detected', 100,
   '["budget_2025.xlsx"]'::jsonb,
   'entropy=7.82 — XOR encryption detected'),

  (now() - interval '30 minutes' + interval '9 seconds',
   'high_entropy_detected', 140,
   '["employee_data.csv"]'::jsonb,
   'entropy=7.91 — XOR encryption detected'),

  (now() - interval '30 minutes' + interval '12 seconds',
   'suspicious_rename', 150,
   '["budget_2025.xlsx", "budget_2025.xlsx.locked"]'::jsonb,
   'rename_pattern_detected — .locked extension'),

  (now() - interval '30 minutes' + interval '15 seconds',
   'suspicious_rename', 160,
   '["employee_data.csv", "employee_data.csv.locked"]'::jsonb,
   'rename_pattern_detected — .locked extension'),

  -- Canary hit — critical
  (now() - interval '30 minutes' + interval '18 seconds',
   'canary_accessed', 200,
   '["sandbox/_sentinelshield_do_not_touch.txt"]'::jsonb,
   'critical_alert_raised — canary file modified by ransomware'),

  -- Containment
  (now() - interval '29 minutes',
   'containment_complete', 0,
   '[]'::jsonb,
   'threat_score_reset_canary_redeployed'),

  (now() - interval '28 minutes',
   'snapshot_restored', 0,
   '["budget_2025.xlsx","employee_data.csv","report_q1.docx","contracts.pdf","network_config.txt"]'::jsonb,
   'snapshot_id=snap_demo_002'),

  (now() - interval '27 minutes',
   'recovery_complete', 0,
   '["budget_2025.xlsx","employee_data.csv","report_q1.docx","contracts.pdf","network_config.txt"]'::jsonb,
   'system_restored — all files recovered'),

  -- Post-recovery normal
  (now() - interval '20 minutes',
   'snapshot_created', 0,
   '["report_q1.docx","employee_data.csv","budget_2025.xlsx","contracts.pdf","network_config.txt"]'::jsonb,
   'snapshot_id=snap_demo_003'),

  (now() - interval '5 minutes',
   'snapshot_created', 0,
   '["report_q1.docx","employee_data.csv","budget_2025.xlsx","contracts.pdf","network_config.txt"]'::jsonb,
   'snapshot_id=snap_demo_005');
