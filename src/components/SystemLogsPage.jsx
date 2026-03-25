import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ScrollText } from 'lucide-react'

const DUMMY = [
  { timestamp: new Date().toISOString(), event_type: 'monitoring_started', threat_score: 0,   action_taken: 'watchdog_observer_started' },
  { timestamp: new Date().toISOString(), event_type: 'canary_deployed',    threat_score: 0,   action_taken: 'canary_created' },
  { timestamp: new Date().toISOString(), event_type: 'snapshot_created',   threat_score: 0,   action_taken: 'snapshot_id=snap_demo' },
]

const levelColor = (type, score) => {
  if (type?.includes('canary') && type !== 'canary_deployed') return '#FF3B3B'
  if (score >= 70) return '#FF3B3B'
  if (score >= 30) return '#F2C94C'
  return '#4a6080'
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState(DUMMY)
  useEffect(() => { api.threatEvents(100).then(d => { if (d?.length) setLogs(d) }) }, [])

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText size={16} className="text-[#2F80ED]" />
        <p className="text-white font-semibold text-lg">System Logs</p>
      </div>
      <div className="glass rounded-xl p-4 font-mono text-xs space-y-1">
        {logs.map((l, i) => (
          <div key={i} className="flex gap-4 py-1.5 border-b border-[#0d1f35]">
            <span className="text-[#2a3d55] shrink-0 w-20">
              {l.timestamp ? new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false }) : ''}
            </span>
            <span className="shrink-0 w-40 truncate" style={{ color: levelColor(l.event_type, l.threat_score) }}>
              {l.event_type}
            </span>
            <span className="text-[#8ba0b8] truncate">{l.action_taken}</span>
            {l.threat_score > 0 && <span className="ml-auto text-[#F2C94C] shrink-0">+{l.threat_score}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
