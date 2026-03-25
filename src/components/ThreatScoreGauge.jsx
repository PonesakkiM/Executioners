export default function ThreatScoreGauge({ score = 0 }) {
  const clamped = Math.min(Math.max(score, 0), 100)
  const color   = clamped >= 70 ? '#FF3B3B' : clamped >= 30 ? '#F2C94C' : '#00FFB2'
  const label   = clamped >= 70 ? 'CRITICAL' : clamped >= 30 ? 'ELEVATED' : 'NORMAL'

  // SVG arc math
  const r = 52, cx = 64, cy = 64
  const startAngle = -220, endAngle = 40
  const totalArc = endAngle - startAngle
  const fillArc  = (clamped / 100) * totalArc
  const toRad = (d) => (d * Math.PI) / 180
  const arcPath = (start, end) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) }
    const e = { x: cx + r * Math.cos(toRad(end)),   y: cy + r * Math.sin(toRad(end)) }
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  return (
    <div className="glass rounded-xl p-5 flex flex-col items-center gap-3">
      <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Threat Score</p>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" className="w-full h-full">
          {/* Track */}
          <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#1a2d4a" strokeWidth="8" strokeLinecap="round" />
          {/* Fill */}
          <path
            d={arcPath(startAngle, startAngle + fillArc)}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'all 0.6s ease' }}
          />
          {/* Zone markers */}
          {[30, 70].map((pct) => {
            const angle = startAngle + (pct / 100) * totalArc
            const ix = cx + (r + 10) * Math.cos(toRad(angle))
            const iy = cy + (r + 10) * Math.sin(toRad(angle))
            return <circle key={pct} cx={ix} cy={iy} r="2" fill="#1a2d4a" />
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono" style={{ color, textShadow: `0 0 15px ${color}80` }}>
            {clamped}
          </span>
          <span className="text-[#4a6080] text-xs">/ 100</span>
        </div>
      </div>
      <span
        className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
      >
        {label}
      </span>
      {/* Legend */}
      <div className="flex gap-3 text-xs text-[#4a6080]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00FFB2]" />0–30</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F2C94C]" />30–70</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF3B3B]" />70+</span>
      </div>
    </div>
  )
}
