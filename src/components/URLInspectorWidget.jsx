import { useState } from 'react'
import { Globe, AlertTriangle, ChevronDown, ChevronUp, Eye } from 'lucide-react'

const DEMO_URLS = [
  { displayed: 'microsoft.com',       actual: 'microsoft-support-update.top', risk: 'HIGH'   },
  { displayed: 'paypal.com/login',    actual: 'paypa1-secure-login.ru',        risk: 'CRITICAL'},
  { displayed: 'google.com',          actual: 'google.com',                    risk: 'SAFE'   },
]

const riskColor = { HIGH: '#b7770d', CRITICAL: '#c0392b', SAFE: '#2d6a4f' }
const riskBg    = { HIGH: '#fef3cd', CRITICAL: '#fde8e6', SAFE: '#d4edda' }

export default function URLInspectorWidget() {
  const [open, setOpen] = useState(true)
  const [idx, setIdx] = useState(0)
  const url = DEMO_URLS[idx]
  const color = riskColor[url.risk]
  const bg    = riskBg[url.risk]

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-72 rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${color}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.12)`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 border-b transition-colors"
        style={{ borderColor: '#D1BFA2' }}
        onMouseEnter={e => e.currentTarget.style.background = '#F5F5DC'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Eye size={13} style={{ color }} />
        <span className="text-xs font-semibold flex-1 text-left" style={{ color: '#1a1a1a' }}>URL Inspector</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color, background: bg, border: `1px solid ${color}` }}
        >
          {url.risk}
        </span>
        {open
          ? <ChevronDown size={13} style={{ color: '#6b5a45' }} />
          : <ChevronUp   size={13} style={{ color: '#6b5a45' }} />
        }
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs mb-1" style={{ color: '#6b5a45' }}>Displayed URL</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
              <Globe size={12} style={{ color: '#C2A68D' }} />
              <span className="text-xs font-mono" style={{ color: '#1a1a1a' }}>{url.displayed}</span>
            </div>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#6b5a45' }}>Actual Destination</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: bg, border: `1px solid ${color}` }}>
              <AlertTriangle size={12} style={{ color }} />
              <span className="text-xs font-mono" style={{ color }}>{url.actual}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs" style={{ color: '#6b5a45' }}>Risk Level:</span>
            <span className="text-xs font-bold" style={{ color }}>{url.risk}</span>
          </div>
          {/* Demo cycle */}
          <div className="flex gap-1 pt-1">
            {DEMO_URLS.map((u, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="flex-1 py-1 rounded text-xs transition-colors"
                style={i === idx
                  ? { background: riskBg[u.risk], color: riskColor[u.risk], border: `1px solid ${riskColor[u.risk]}` }
                  : { background: '#F5F5DC', color: '#6b5a45', border: '1px solid #D1BFA2' }
                }
              >
                {u.risk}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
