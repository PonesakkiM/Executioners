import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SystemStatusCard({ status = 'secure', score = 0 }) {
  const isAttack = status === 'critical'
  const isWarn   = status === 'warning'
  const color    = isAttack ? '#c0392b' : isWarn ? '#b7770d' : '#2d6a4f'
  const bgColor  = isAttack ? '#fde8e6' : isWarn ? '#fef3cd' : '#d4edda'
  const borderColor = isAttack ? '#c0392b' : isWarn ? '#b7770d' : '#2d6a4f'
  const label    = isAttack ? 'UNDER ATTACK' : isWarn ? 'WARNING' : 'PROTECTED'

  return (
    <div
      className="rounded-xl p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
      style={{ background: '#FFFFFF', border: `1px solid ${borderColor}`, boxShadow: `0 2px 8px ${color}20` }}
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
          className={`relative p-5 rounded-full`}
          style={{
            background: bgColor,
            border: `2px solid ${borderColor}`,
            animation: isAttack ? 'pulse-red 1.2s ease-in-out infinite' : 'pulse-green 2s ease-in-out infinite',
          }}
        >
          <Shield size={40} style={{ color }} strokeWidth={1.5} />
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#6b5a45' }}>System Status</p>
        <p className="text-xl font-bold" style={{ color }}>
          {label}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 pt-2 w-full justify-center border-t" style={{ borderColor: '#D1BFA2' }}>
        {[['48', 'Nodes'], ['284K', 'Files'], ['99.97%', 'Uptime']].map(([v, l]) => (
          <div key={l} className="text-center">
            <p className="font-bold text-lg" style={{ color: '#1a1a1a' }}>{v}</p>
            <p className="text-xs" style={{ color: '#6b5a45' }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
