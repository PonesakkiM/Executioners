import { useEffect, useState } from 'react'
import { Shield, Wifi, AlertTriangle, CheckCircle, LogOut } from 'lucide-react'

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <span className="font-mono text-sm" style={{ color: '#6b5a45' }}>
      {t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      <span style={{ color: '#C2A68D' }} className="mx-2">·</span>
      <span style={{ color: '#3d3020' }}>{t.toLocaleTimeString('en-US', { hour12: false })}</span>
    </span>
  )
}

export default function Header({ status = 'secure', user, onLogout }) {
  const isAttack = status === 'critical'
  const isWarn   = status === 'warning'

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b"
      style={{ background: '#FFFFFF', borderColor: '#D1BFA2' }}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className={`relative ${isAttack ? 'animate-pulse-red' : 'animate-pulse-green'}`}>
          <Shield
            size={22}
            style={{ color: isAttack ? '#c0392b' : isWarn ? '#b7770d' : '#2d6a4f' }}
            strokeWidth={1.5}
          />
        </div>
        <span className="font-semibold text-sm tracking-wide" style={{ color: '#1a1a1a' }}>SentinelShield AI</span>
        <span style={{ color: '#C2A68D' }} className="text-lg">|</span>
        <span className="text-xs" style={{ color: '#6b5a45' }}>Ransomware Defense Platform</span>
      </div>

      {/* Center status badge */}
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border ${isAttack ? 'animate-flicker' : ''}`}
        style={isAttack
          ? { background: '#fde8e6', borderColor: '#c0392b', color: '#c0392b' }
          : isWarn
          ? { background: '#fef3cd', borderColor: '#b7770d', color: '#b7770d' }
          : { background: '#d4edda', borderColor: '#2d6a4f', color: '#2d6a4f' }
        }
      >
        {isAttack
          ? <><AlertTriangle size={12} /> UNDER ATTACK</>
          : isWarn
          ? <><AlertTriangle size={12} /> WARNING</>
          : <><CheckCircle size={12} /> SYSTEM PROTECTED</>
        }
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#6b5a45' }}>
          <Wifi size={13} style={{ color: '#C2A68D' }} /> 48 nodes
        </span>
        <LiveClock />
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: '#D1BFA2' }}>
            <div className="text-right">
              <p className="text-xs font-medium leading-tight" style={{ color: '#1a1a1a' }}>{user.name}</p>
              <p className="text-xs" style={{ color: '#6b5a45' }}>{user.role}</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: '#D1BFA2', color: '#3d3020', border: '1px solid #C2A68D' }}>
              {user.avatar}
            </div>
            <button onClick={onLogout} title="Sign out"
              className="transition-colors"
              style={{ color: '#6b5a45' }}
              onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b5a45'}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
