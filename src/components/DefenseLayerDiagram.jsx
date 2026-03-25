import { User, Settings, Shield, ChevronRight, Zap } from 'lucide-react'

const layers = [
  {
    icon: User,
    label: 'Human Layer',
    sub: 'Awareness & Training',
    desc: 'Phishing detection, MFA, link inspection',
    color: '#2F80ED',
    bg: 'rgba(47,128,237,0.08)',
    border: 'rgba(47,128,237,0.2)',
    glow: 'rgba(47,128,237,0.3)',
  },
  {
    icon: Settings,
    label: 'Technical Layer',
    sub: 'OS Hardening',
    desc: 'Antivirus, email filtering, firewall',
    color: '#F2C94C',
    bg: 'rgba(242,201,76,0.08)',
    border: 'rgba(242,201,76,0.2)',
    glow: 'rgba(242,201,76,0.3)',
  },
  {
    icon: Shield,
    label: 'SentinelShield Core',
    sub: 'Endpoint Protection',
    desc: 'Canary detection, behavioral scoring, snapshots',
    color: '#00FFB2',
    bg: 'rgba(0,255,178,0.08)',
    border: 'rgba(0,255,178,0.2)',
    glow: 'rgba(0,255,178,0.4)',
  },
]

export default function DefenseLayerDiagram() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={14} className="text-[#00FFB2]" />
        <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">
          Multi-Layer Defense Architecture
        </p>
      </div>
      <div className="flex items-stretch gap-3">
        {layers.map((l, i) => (
          <div key={i} className="flex items-center gap-3 flex-1">
            <div
              className="flex-1 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] cursor-default"
              style={{ background: l.bg, border: `1px solid ${l.border}`, boxShadow: `0 0 20px ${l.glow}` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ background: `${l.color}15` }}>
                  <l.icon size={18} style={{ color: l.color }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{l.label}</p>
                  <p className="text-xs" style={{ color: l.color }}>{l.sub}</p>
                </div>
              </div>
              <p className="text-[#4a6080] text-xs leading-relaxed">{l.desc}</p>
            </div>
            {i < layers.length - 1 && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <ChevronRight size={18} className="text-[#1a2d4a]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
