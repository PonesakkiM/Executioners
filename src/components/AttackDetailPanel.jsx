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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{
        background: '#0a1628',
        border: '1px solid rgba(255,59,59,0.3)',
        boxShadow: '0 0 60px rgba(255,59,59,0.15)',
      }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a2d4a]" style={{ background: 'rgba(255,59,59,0.08)' }}>
          <div className="p-2 rounded-lg bg-[#FF3B3B]/15">
            <AlertTriangle size={18} className="text-[#FF3B3B]" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">Attack Analysis Report</p>
            <p className="text-[#FF3B3B] text-xs">Ransomware behavior detected and contained</p>
          </div>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {!detail ? (
            <p className="text-[#4a6080] text-sm text-center py-8">Loading attack details...</p>
          ) : (
            <>
              {/* How it happened */}
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase mb-3 flex items-center gap-2">
                  <Zap size={12} className="text-[#FF3B3B]" /> How the Attack Happened
                </p>
                <div className="space-y-2">
                  {detail.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#050d1a] border border-[#1a2d4a]">
                      <ChevronRight size={13} className="text-[#FF3B3B] mt-0.5 shrink-0" />
                      <p className="text-[#8ba0b8] text-xs">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Where */}
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase mb-3 flex items-center gap-2">
                  <MapPin size={12} className="text-[#F2C94C]" /> Attack Location
                </p>
                <div className="px-3 py-2.5 rounded-lg bg-[#050d1a] border border-[#1a2d4a] font-mono text-xs text-[#F2C94C]">
                  {detail.attack_location}
                </div>
                <p className="text-[#4a6080] text-xs mt-2">{detail.attack_vector}</p>
              </div>

              {/* Attacked files */}
              {detail.attacked_files?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase mb-3 flex items-center gap-2">
                    <Lock size={12} className="text-[#FF3B3B]" /> Encrypted Files ({detail.attacked_files.length})
                  </p>
                  <div className="space-y-1.5">
                    {detail.attacked_files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#FF3B3B]/08 border border-[#FF3B3B]/20">
                        <Lock size={12} className="text-[#FF3B3B] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[#FF3B3B] text-xs font-mono truncate">{f.name}</p>
                          <p className="text-[#4a6080] text-xs">Original: {f.original} · {(f.size/1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="flex gap-4 p-4 rounded-xl bg-[#050d1a] border border-[#1a2d4a]">
                {[
                  ['Total Affected', detail.total_affected, '#FF3B3B'],
                  ['Encrypted',      detail.attacked_files?.length ?? 0, '#FF3B3B'],
                  ['Quarantined',    detail.quarantined_files?.length ?? 0, '#F2C94C'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex-1 text-center">
                    <p className="text-2xl font-bold font-mono" style={{ color }}>{val}</p>
                    <p className="text-[#4a6080] text-xs mt-1">{label}</p>
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
