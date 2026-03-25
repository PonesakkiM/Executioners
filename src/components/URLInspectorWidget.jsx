import { useState } from 'react'
import { Globe, AlertTriangle, ChevronDown, ChevronUp, Eye } from 'lucide-react'

const DEMO_URLS = [
  { displayed: 'microsoft.com',       actual: 'microsoft-support-update.top', risk: 'HIGH'   },
  { displayed: 'paypal.com/login',    actual: 'paypa1-secure-login.ru',        risk: 'CRITICAL'},
  { displayed: 'google.com',          actual: 'google.com',                    risk: 'SAFE'   },
]

const riskColor = { HIGH: '#F2C94C', CRITICAL: '#FF3B3B', SAFE: '#00FFB2' }

export default function URLInspectorWidget() {
  const [open, setOpen] = useState(true)
  const [idx, setIdx] = useState(0)
  const url = DEMO_URLS[idx]
  const color = riskColor[url.risk]

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-72 rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(5,13,26,0.95)',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 30px ${color}20, 0 8px 32px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-[#1a2d4a] hover:bg-white/[0.02] transition-colors"
      >
        <Eye size={13} style={{ color }} />
        <span className="text-xs font-semibold text-white flex-1 text-left">URL Inspector</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
        >
          {url.risk}
        </span>
        {open ? <ChevronDown size={13} className="text-[#4a6080]" /> : <ChevronUp size={13} className="text-[#4a6080]" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[#4a6080] text-xs mb-1">Displayed URL</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a1628] rounded-lg border border-[#1a2d4a]">
              <Globe size={12} className="text-[#2F80ED]" />
              <span className="text-white text-xs font-mono">{url.displayed}</span>
            </div>
          </div>
          <div>
            <p className="text-[#4a6080] text-xs mb-1">Actual Destination</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: `${color}08`, borderColor: `${color}30` }}>
              <AlertTriangle size={12} style={{ color }} />
              <span className="text-xs font-mono" style={{ color }}>{url.actual}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#4a6080]">Risk Level:</span>
            <span className="text-xs font-bold" style={{ color, textShadow: `0 0 8px ${color}60` }}>{url.risk}</span>
          </div>
          {/* Demo cycle */}
          <div className="flex gap-1 pt-1">
            {DEMO_URLS.map((u, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="flex-1 py-1 rounded text-xs transition-colors"
                style={i === idx
                  ? { background: `${riskColor[u.risk]}20`, color: riskColor[u.risk], border: `1px solid ${riskColor[u.risk]}30` }
                  : { background: '#0a1628', color: '#2a3d55', border: '1px solid #1a2d4a' }
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
