import { useEffect, useState } from 'react'
import { Shield, Wifi, AlertTriangle, CheckCircle, LogOut } from 'lucide-react'

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <span className="font-mono text-sm text-[#4a6080]">
      {t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      <span className="text-[#2a3d55] mx-2">·</span>
      <span className="text-[#00FFB2]">{t.toLocaleTimeString('en-US', { hour12: false })}</span>
    </span>
  )
}

export default function Header({ status = 'secure', user, onLogout }) {
  const isAttack = status === 'critical'
  const isWarn   = status === 'warning'

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[#1a2d4a] bg-[#070f1e]/80 backdrop-blur-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className={`relative ${isAttack ? 'animate-pulse-red' : 'animate-pulse-green'}`}>
          <Shield
            size={22}
            className={isAttack ? 'text-[#FF3B3B]' : isWarn ? 'text-[#F2C94C]' : 'text-[#00FFB2]'}
            strokeWidth={1.5}
          />
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">SentinelShield AI</span>
        <span className="text-[#1a2d4a] text-lg">|</span>
        <span className="text-[#4a6080] text-xs">Ransomware Defense Platform</span>
      </div>

      {/* Center status badge */}
      <div className={`
        flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border
        ${isAttack
          ? 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30 text-[#FF3B3B] animate-flicker'
          : isWarn
          ? 'bg-[#F2C94C]/10 border-[#F2C94C]/30 text-[#F2C94C]'
          : 'bg-[#00FFB2]/10 border-[#00FFB2]/30 text-[#00FFB2]'}
      `}>
        {isAttack
          ? <><AlertTriangle size={12} /> UNDER ATTACK</>
          : isWarn
          ? <><AlertTriangle size={12} /> WARNING</>
          : <><CheckCircle size={12} /> SYSTEM PROTECTED</>
        }
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-xs text-[#4a6080]">
          <Wifi size={13} className="text-[#2F80ED]" /> 48 nodes
        </span>
        <LiveClock />
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-[#1a2d4a]">
            <div className="text-right">
              <p className="text-white text-xs font-medium leading-tight">{user.name}</p>
              <p className="text-[#4a6080] text-xs">{user.role}</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(47,128,237,0.15)', color: '#2F80ED', border: '1px solid rgba(47,128,237,0.2)' }}>
              {user.avatar}
            </div>
            <button onClick={onLogout} title="Sign out"
              className="text-[#2a3d55] hover:text-[#FF3B3B] transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
