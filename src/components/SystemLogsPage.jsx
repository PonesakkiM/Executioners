import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ScrollText } from 'lucide-react'

const DUMMY = [
  { timestamp: new Date().toISOString(), event_type: 'monitoring_started', threat_score: 0,   action_taken: 'watchdog_observer_started' },
  { timestamp: new Date().toISOString(), event_type: 'canary_deployed',    threat_score: 0,   action_taken: 'canary_created' },
  { timestamp: new Date().toISOString(), event_type: 'snapshot_created',   threat_score: 0,   action_taken: 'snapshot_id=snap_demo' },
]

const levelColor = (type, score) => {
  if (type?.includes('canary') && type !== 'canary_deployed') return '#c0392b'
  if (score >= 70) return '#c0392b'
  if (score >= 30) return '#b7770d'
  return '#6b5a45'
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState(DUMMY)
  useEffect(() => { api.threatEvents(100).then(d => { if (d?.length) setLogs(d) }) }, [])

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText size={16} style={{ color: '#C2A68D' }} />
        <p className="font-semibold text-lg" style={{ color: '#1a1a1a' }}>System Logs</p>
      </div>
      <div className="rounded-xl p-4 font-mono text-xs space-y-1" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
        {logs.map((l, i) => (
          <div key={i} className="flex gap-4 py-1.5 border-b" style={{ borderColor: '#F5F5DC' }}>
            <span className="shrink-0 w-20" style={{ color: '#C2A68D' }}>
              {l.timestamp ? new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false }) : ''}
            </span>
            <span className="shrink-0 w-40 truncate" style={{ color: levelColor(l.event_type, l.threat_score) }}>
              {l.event_type}
            </span>
            <span className="truncate" style={{ color: '#3d3020' }}>{l.action_taken}</span>
            {l.threat_score > 0 && <span className="ml-auto shrink-0" style={{ color: '#b7770d' }}>+{l.threat_score}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
