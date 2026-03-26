import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import LiveActivityFeed from './LiveActivityFeed'
import EntropyGraph from './EntropyGraph'
import ThreatScoreGauge from './ThreatScoreGauge'

export default function ThreatActivityPage() {
  const [score, setScore] = useState(0)

  useEffect(() => {
    const poll = () => api.status().then(d => { if (d) setScore(Math.min(d.threat_score, 100)) })
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5 space-y-4" style={{ background: '#F5F5DC' }}>
      <p className="font-semibold text-lg" style={{ color: '#1a1a1a' }}>Threat Monitor</p>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2"><ThreatScoreGauge score={score} /></div>
        <div className="col-span-10 h-80"><LiveActivityFeed /></div>
      </div>
      <EntropyGraph />
    </div>
  )
}
