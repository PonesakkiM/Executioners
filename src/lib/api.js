const BASE = 'http://localhost:8000'

async function req(path, opts = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, opts)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function del(path) {
  try {
    const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
    return res.json()
  } catch { return null }
}

export const api = {
  status:           () => req('/status'),
  threatEvents:     (limit = 50) => req(`/threat-events?limit=${limit}`),
  snapshots:        () => req('/snapshots'),
  quarantine:       () => req('/quarantine'),
  hardening:        () => req('/system-hardening'),
  simulateAttack:   () => req('/simulate-attack', { method: 'POST' }),
  contain:          () => req('/contain', { method: 'POST' }),
  takeSnapshot:     () => req('/snapshot', { method: 'POST' }),
  restore:          (id) => req(`/restore/${id}`, { method: 'POST' }),
  snapshotFiles:    (id) => req(`/snapshots/${id}/files`),
  addPath:          (path) => req('/paths/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  }),

  // Auth
  login:            (email, password) => req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }),
  setSession:       (user) => req('/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }),
  listFiles:        () => req('/files'),
  fileContent:      (name) => req(`/files/${encodeURIComponent(name)}/content`),
  fileDiff:         (name, snapId) => req(`/files/${encodeURIComponent(name)}/diff/${snapId}`),
  attackDetail:     () => req('/attack-detail'),

  // Quarantine actions
  quarantineFile:   (name) => req(`/quarantine/${encodeURIComponent(name)}`, { method: 'POST' }),
  quarantineAttacked: () => req('/quarantine-attacked', { method: 'POST' }),
  deleteQuarantine: (name) => del(`/quarantine/${encodeURIComponent(name)}`),
  restoreQuarantine:(name) => req(`/quarantine/${encodeURIComponent(name)}/restore`, { method: 'POST' }),
  reset:            () => req('/reset', { method: 'POST' }),
}
