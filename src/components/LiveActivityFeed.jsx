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

function rowColor(type, score) {
  if (type?.includes('canary') || score >= 70) return { text: '#FF3B3B', bg: 'rgba(255,59,59,0.05)', border: 'rgba(255,59,59,0.15)' }
  if (score >= 30 || type?.includes('entropy') || type?.includes('rapid')) return { text: '#F2C94C', bg: 'rgba(242,201,76,0.05)', border: 'rgba(242,201,76,0.15)' }
  return { text: '#4a6080', bg: 'transparent', border: 'transparent' }
}

function fmt(ts) {
  if (!ts) return '--:--:--'
  // Already a valid ISO or date string
  const d = new Date(ts)
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  // Fallback: return as-is if it looks like HH:MM:SS
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
    <div className="glass rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Terminal size={14} className="text-[#00FFB2]" />
        <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Live File Activity</p>
        <span className="ml-auto flex items-center gap-1 text-xs text-[#00FFB2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] animate-pulse" /> LIVE
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 font-mono text-xs">
        {events.map((e, i) => {
          const c = rowColor(e.event_type, e.threat_score)
          return (
            <div
              key={e.id ?? i}
              className="flex items-start gap-3 px-3 py-2 rounded-lg transition-all"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
            >
              <span className="text-[#2a3d55] shrink-0 w-16">{fmt(e.timestamp)}</span>
              <span className="text-[#2F80ED] shrink-0 truncate max-w-[140px]">{e.event_type}</span>
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
