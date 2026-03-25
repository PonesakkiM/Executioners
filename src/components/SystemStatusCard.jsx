import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SystemStatusCard({ status = 'secure', score = 0 }) {
  const isAttack = status === 'critical'
  const isWarn   = status === 'warning'
  const color    = isAttack ? '#FF3B3B' : isWarn ? '#F2C94C' : '#00FFB2'
  const label    = isAttack ? 'UNDER ATTACK' : isWarn ? 'WARNING' : 'PROTECTED'

  return (
    <div
      className="glass rounded-xl p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
      style={{ boxShadow: `0 0 30px ${color}20` }}
    >
      {/* Scan line effect */}
      {isAttack && (
        <div
          className="absolute left-0 right-0 h-0.5 animate-scan pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
        />
      )}

      {/* Shield icon */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-40"
          style={{ background: color, transform: 'scale(1.5)' }}
        />
        <div
          className={`relative p-5 rounded-full`}
          style={{
            background: `${color}15`,
            border: `2px solid ${color}40`,
            animation: isAttack ? 'pulse-red 1.2s ease-in-out infinite' : 'pulse-green 2s ease-in-out infinite',
          }}
        >
          <Shield size={40} style={{ color }} strokeWidth={1.5} />
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs text-[#4a6080] uppercase tracking-widest mb-1">System Status</p>
        <p className="text-xl font-bold" style={{ color, textShadow: `0 0 20px ${color}80` }}>
          {label}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 pt-2 border-t border-[#1a2d4a] w-full justify-center">
        {[['48', 'Nodes'], ['284K', 'Files'], ['99.97%', 'Uptime']].map(([v, l]) => (
          <div key={l} className="text-center">
            <p className="text-white font-bold text-lg">{v}</p>
            <p className="text-[#4a6080] text-xs">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
