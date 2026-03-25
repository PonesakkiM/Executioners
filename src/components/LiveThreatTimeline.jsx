import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { XCircle, AlertTriangle, Info, Shield } from 'lucide-react'

const iconFor = (type) => {
  if (type?.includes('canary'))   return <XCircle size={14} className="text-[#f85149]" />
  if (type?.includes('critical') || type?.includes('rapid') || type?.includes('entropy'))
    return <AlertTriangle size={14} className="text-[#d29922]" />
  if (type?.includes('snapshot') || type?.includes('restore') || type?.includes('recovery'))
    return <Shield size={14} className="text-[#00ff88]" />
  return <Info size={14} className="text-[#58a6ff]" />
}

export default function LiveThreatTimeline() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    // Initial load
    api.threatEvents(30).then(data => { if (data) setEvents(data) })

    // Real-time subscription
    const channel = supabase
      .channel('threat_events_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threat_events' },
        (payload) => setEvents(prev => [payload.new, ...prev].slice(0, 50))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
      <p className="text-xs font-semibold tracking-widest text-[#8b949e] uppercase mb-4">
        Live Threat Timeline
      </p>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {events.length === 0 && (
          <p className="text-[#484f58] text-sm text-center py-4">No events yet</p>
        )}
        {events.map((e, i) => (
          <div key={e.id ?? i} className="flex items-start gap-3 p-3 bg-[#0d1117] border border-[#21262d] rounded-lg">
            <div className="mt-0.5">{iconFor(e.event_type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white text-xs font-medium truncate">{e.event_type}</span>
                <span className="text-[#484f58] text-xs shrink-0">
                  {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              <p className="text-[#8b949e] text-xs mt-0.5">{e.action_taken}</p>
              {e.threat_score > 0 && (
                <span className="text-xs text-[#d29922]">score: {e.threat_score}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
