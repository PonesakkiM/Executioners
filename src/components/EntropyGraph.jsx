import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

const DUMMY_DATA = [
  { time: '11:55', entropy: 2.1 }, { time: '11:56', entropy: 2.4 },
  { time: '11:57', entropy: 3.1 }, { time: '11:58', entropy: 2.8 },
  { time: '11:59', entropy: 4.2 }, { time: '12:00', entropy: 3.9 },
  { time: '12:01', entropy: 5.1 }, { time: '12:02', entropy: 6.3 },
  { time: '12:03', entropy: 7.1 }, { time: '12:04', entropy: 7.8 },
  { time: '12:05', entropy: 7.6 }, { time: '12:06', entropy: 4.2 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const danger = val > 7.5
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
      <p style={{ color: '#6b5a45' }}>{label}</p>
      <p style={{ color: danger ? '#c0392b' : '#2d6a4f' }} className="font-mono font-bold">
        Entropy: {val.toFixed(2)} {danger ? '⚠ DANGEROUS' : ''}
      </p>
    </div>
  )
}

export default function EntropyGraph() {
  const [data, setData] = useState(DUMMY_DATA)

  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1]
        const now = new Date()
        const newVal = Math.max(0, Math.min(8, last.entropy + (Math.random() - 0.5) * 1.5))
        const newPoint = {
          time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          entropy: parseFloat(newVal.toFixed(2))
        }
        return [...prev.slice(-19), newPoint]
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={14} style={{ color: '#C2A68D' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>File Entropy Analysis</p>
        <span className="ml-auto text-xs flex items-center gap-1" style={{ color: '#c0392b' }}>
          <span className="w-2 h-0.5 inline-block" style={{ background: '#c0392b' }} /> Danger threshold (7.5)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="entropyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#C2A68D" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#C2A68D" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#c0392b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c0392b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D1BFA2" />
          <XAxis dataKey="time" tick={{ fill: '#6b5a45', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 8]} tick={{ fill: '#6b5a45', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={7.5} stroke="#c0392b" strokeDasharray="4 4" strokeOpacity={0.7} />
          <Area
            type="monotone" dataKey="entropy"
            stroke="#C2A68D" strokeWidth={2}
            fill="url(#entropyGrad)"
            dot={false} activeDot={{ r: 4, fill: '#C2A68D' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
