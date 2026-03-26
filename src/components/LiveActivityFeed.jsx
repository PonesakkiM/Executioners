import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { Terminal } from 'lucide-react'

const now = Date.now()
const DUMMY = [
  { id: 1, timestamp: new Date(now - 240000).toISOString(), event_type: 'monitoring_started',  action_taken: 'watchdog_observer_started',        threat_score: 0   },
  { id: 2, timestamp: new Date(now - 180000).toISOString(), event_type: 'canary_deployed',      action_taken: '_sentinelshield_do_not_touch.txt', threat_score: 0   },
  { id: 3, timestamp: new Date(now - 120000).toISOString(), event_type: 'file_modified',        action_taken: 'report.docx',                     threat_score: 0   },
  { id: 4, timestamp: new Date(now -  60000).toISOString(), event_type: 'rapid_modification',   action_taken: 'budget_2025.xlsx',                 threat_score: 30  },
  { id: 5, timestamp: new Date(now -  45000).toISOString(), event_type: 'high_entropy_detected',action_taken: 'entropy=7.82 data.xlsx',           threat_score: 40  },
  { id: 6, timestamp: new Date(now -  30000).toISOString(), event_type: 'canary_accessed',      action_taken: '_sentinelshield_do_not_touch.txt', threat_score: 100 },
  { id: 7, timestamp: new Date(now -  10000).toISOString(), event_type: 'containment_complete', action_taken: 'threat_score_reset',               threat_score: 0   },
]

function rowStyle(type, score) {
  if (type?.includes('canary') || score >= 70)
    return { text: '#c0392b', bg: '#fde8e6', border: '#f5c6c2' }
  if (score >= 30 || type?.includes('entropy') || type?.includes('rapid'))
    return { text: '#b7770d', bg: '#fef3cd', border: '#fde68a' }
  return { text: '#3d3020', bg: 'transparent', border: 'transparent' }
}

function fmt(ts) {
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  return ts
}

export default function LiveActivityFeed() {
  const [events, setEvents] = useState(DUMMY)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.threatEvents(30).then(d => { if (d?.length) setEvents(d) })
    const ch = supabase.channel('feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threat_events' },
        p => setEvents(prev => [p.new, ...prev].slice(0, 100)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  return (
    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
      <div className="flex items-center gap-2 mb-3">
        <Terminal size={14} style={{ color: '#2d6a4f' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Live File Activity</p>
        <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#2d6a4f' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2d6a4f' }} /> LIVE
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 font-mono text-xs">
        {events.map((e, i) => {
          const c = rowStyle(e.event_type, e.threat_score)
          return (
            <div
              key={e.id ?? i}
              className="flex items-start gap-3 px-3 py-2 rounded-lg transition-all"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
            >
              <span className="shrink-0 w-16" style={{ color: '#6b5a45' }}>{fmt(e.timestamp)}</span>
              <span className="shrink-0 truncate max-w-[140px]" style={{ color: '#C2A68D' }}>{e.event_type}</span>
              <span style={{ color: c.text }} className="truncate">{e.action_taken}</span>
              {e.threat_score > 0 && (
                <span className="ml-auto shrink-0" style={{ color: c.text }}>+{e.threat_score}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
