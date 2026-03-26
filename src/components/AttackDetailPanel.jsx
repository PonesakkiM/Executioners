import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { AlertTriangle, MapPin, Zap, ChevronRight, Lock, X } from 'lucide-react'

export default function AttackDetailPanel({ visible, onClose }) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (visible) api.attackDetail().then(setDetail)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid #c0392b', boxShadow: '0 8px 32px rgba(192,57,43,0.15)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ background: '#fde8e6', borderColor: '#f5c6c2' }}>
          <div className="p-2 rounded-lg" style={{ background: '#fde8e6', border: '1px solid #c0392b' }}>
            <AlertTriangle size={18} style={{ color: '#c0392b' }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: '#1a1a1a' }}>Attack Analysis Report</p>
            <p className="text-xs" style={{ color: '#c0392b' }}>Ransomware behavior detected and contained</p>
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: '#6b5a45' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b5a45'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {!detail ? (
            <p className="text-sm text-center py-8" style={{ color: '#6b5a45' }}>Loading attack details...</p>
          ) : (
            <>
              {/* How it happened */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#6b5a45' }}>
                  <Zap size={12} style={{ color: '#c0392b' }} /> How the Attack Happened
                </p>
                <div className="space-y-2">
                  {detail.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                      style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
                      <ChevronRight size={13} style={{ color: '#c0392b' }} className="mt-0.5 shrink-0" />
                      <p className="text-xs" style={{ color: '#3d3020' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Where */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#6b5a45' }}>
                  <MapPin size={12} style={{ color: '#b7770d' }} /> Attack Location
                </p>
                <div className="px-3 py-2.5 rounded-lg font-mono text-xs"
                  style={{ background: '#fef3cd', border: '1px solid #fde68a', color: '#b7770d' }}>
                  {detail.attack_location}
                </div>
                <p className="text-xs mt-2" style={{ color: '#6b5a45' }}>{detail.attack_vector}</p>
              </div>

              {/* Attacked files */}
              {detail.attacked_files?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#6b5a45' }}>
                    <Lock size={12} style={{ color: '#c0392b' }} /> Encrypted Files ({detail.attacked_files.length})
                  </p>
                  <div className="space-y-1.5">
                    {detail.attacked_files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ background: '#fde8e6', border: '1px solid #f5c6c2' }}>
                        <Lock size={12} style={{ color: '#c0392b' }} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono truncate" style={{ color: '#c0392b' }}>{f.name}</p>
                          <p className="text-xs" style={{ color: '#6b5a45' }}>Original: {f.original} · {(f.size/1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="flex gap-4 p-4 rounded-xl" style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
                {[
                  ['Total Affected', detail.total_affected, '#c0392b'],
                  ['Encrypted',      detail.attacked_files?.length ?? 0, '#c0392b'],
                  ['Quarantined',    detail.quarantined_files?.length ?? 0, '#b7770d'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex-1 text-center">
                    <p className="text-2xl font-bold font-mono" style={{ color }}>{val}</p>
                    <p className="text-xs mt-1" style={{ color: '#6b5a45' }}>{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
