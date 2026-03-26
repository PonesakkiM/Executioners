import { AlertTriangle, CheckCircle, Eye } from 'lucide-react'

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
  const isTriggered = triggered || !canaryIntact

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden transition-all duration-500 h-full"
      style={isTriggered ? {
        background: '#FFFFFF',
        border: '1px solid #c0392b',
        boxShadow: '0 2px 12px rgba(192,57,43,0.2)',
        animation: 'pulse-red 1.2s ease-in-out infinite',
      } : {
        background: '#FFFFFF',
        border: '1px solid #D1BFA2',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Eye size={14} style={{ color: isTriggered ? '#c0392b' : '#2d6a4f' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Canary Detection</p>
        {isTriggered && (
          <span className="ml-auto text-xs font-bold animate-flicker" style={{ color: '#c0392b' }}>● ALERT</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-4 rounded-xl shrink-0"
          style={isTriggered
            ? { background: '#fde8e6', border: '1px solid #c0392b' }
            : { background: '#d4edda', border: '1px solid #2d6a4f' }
          }
        >
          {isTriggered
            ? <AlertTriangle size={28} className="animate-flicker" style={{ color: '#c0392b' }} />
            : <CheckCircle  size={28} style={{ color: '#2d6a4f' }} />
          }
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: isTriggered ? '#c0392b' : '#2d6a4f' }}>
            Canary Status: {isTriggered ? 'TRIGGERED' : 'SAFE'}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#6b5a45' }}>
            {isTriggered
              ? 'Ransomware touched the trap file — attack confirmed before full encryption'
              : 'Trap file untouched — no ransomware activity detected'}
          </p>
        </div>
      </div>

      {/* What is a canary — tooltip row */}
      <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
        <p className="text-xs" style={{ color: '#3d3020' }}>
          💡 A canary file is a hidden trap. If ransomware touches it, we know an attack is happening
          <span style={{ color: '#C2A68D' }}> before your real files are encrypted.</span>
        </p>
      </div>

      {/* Canary file status row */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${isTriggered ? 'animate-pulse' : ''}`}
          style={{ background: isTriggered ? '#c0392b' : '#2d6a4f' }} />
        <span className="font-mono text-xs flex-1 truncate" style={{ color: '#6b5a45' }}>
          _sentinelshield_do_not_touch.txt
        </span>
        <span className="text-xs font-bold shrink-0" style={{ color: isTriggered ? '#c0392b' : '#2d6a4f' }}>
          {canaryIntact && !triggered ? 'INTACT' : 'MODIFIED'}
        </span>
      </div>

      {isTriggered && (
        <p className="mt-2 text-xs font-mono px-1" style={{ color: '#c0392b' }}>
          ⚠ Canary file was modified by the ransomware process
        </p>
      )}
    </div>
  )
}
