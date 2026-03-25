import { AlertTriangle, CheckCircle, Eye, RefreshCw } from 'lucide-react'

/**
 * WHAT IS A CANARY FILE?
 * A canary file (_sentinelshield_do_not_touch.txt) is a hidden trap placed
 * in every monitored folder. Ransomware attacks files indiscriminately —
 * the moment it touches this file, SentinelShield raises a CRITICAL alert
 * BEFORE your real files are fully encrypted. It's an early-warning tripwire.
 *
 * Props:
 *   triggered    — true when canary was modified (from state.canary_hit)
 *   canaryIntact — true when file content matches original (from status API)
 */
export default function CanaryAlertPanel({ triggered = false, canaryIntact = true }) {
  // If triggered OR content changed → show alert
  const isTriggered = triggered || !canaryIntact

  const color  = isTriggered ? '#FF3B3B' : '#00FFB2'
  const label  = isTriggered ? 'TRIGGERED' : 'SAFE'

  return (
    <div
      className="glass rounded-xl p-5 relative overflow-hidden transition-all duration-500 h-full"
      style={isTriggered ? {
        border: '1px solid rgba(255,59,59,0.5)',
        boxShadow: '0 0 30px rgba(255,59,59,0.2)',
        animation: 'pulse-red 1.2s ease-in-out infinite',
      } : {
        border: '1px solid rgba(0,255,178,0.15)',
        boxShadow: '0 0 20px rgba(0,255,178,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Eye size={14} style={{ color }} />
        <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Canary Detection</p>
        {isTriggered && (
          <span className="ml-auto text-xs text-[#FF3B3B] animate-flicker font-bold">● ALERT</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-4 rounded-xl shrink-0"
          style={isTriggered
            ? { background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)' }
            : { background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.2)' }
          }
        >
          {isTriggered
            ? <AlertTriangle size={28} className="text-[#FF3B3B] animate-flicker" />
            : <CheckCircle  size={28} className="text-[#00FFB2]" />
          }
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color }}>
            Canary Status: {label}
          </p>
          <p className="text-xs text-[#4a6080] leading-relaxed">
            {isTriggered
              ? 'Ransomware touched the trap file — attack confirmed before full encryption'
              : 'Trap file untouched — no ransomware activity detected'}
          </p>
        </div>
      </div>

      {/* What is a canary — tooltip row */}
      <div className="mb-3 px-3 py-2 rounded-lg bg-[#0a1628] border border-[#1a2d4a]">
        <p className="text-[#2a3d55] text-xs">
          💡 A canary file is a hidden trap. If ransomware touches it, we know an attack is happening
          <span className="text-[#2F80ED]"> before your real files are encrypted.</span>
        </p>
      </div>

      {/* Canary file status row */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#050d1a] border border-[#1a2d4a]">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isTriggered ? 'bg-[#FF3B3B] animate-pulse' : 'bg-[#00FFB2]'}`} />
        <span className="font-mono text-xs text-[#4a6080] flex-1 truncate">
          _sentinelshield_do_not_touch.txt
        </span>
        <span className="text-xs font-bold shrink-0" style={{ color }}>
          {canaryIntact && !triggered ? 'INTACT' : 'MODIFIED'}
        </span>
      </div>

      {isTriggered && (
        <p className="mt-2 text-xs text-[#FF3B3B] font-mono px-1">
          ⚠ Canary file was modified by the ransomware process
        </p>
      )}
    </div>
  )
}
