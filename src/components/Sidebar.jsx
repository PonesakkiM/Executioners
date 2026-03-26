import { LayoutDashboard, Activity, FolderOpen, Lock, HardDrive, ScrollText, Users, Shield } from 'lucide-react'

const nav = [
  { id: 'dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'threats',    label: 'Threat Monitor',    icon: Activity },
  { id: 'folders',    label: 'Monitored Folders', icon: FolderOpen },
  { id: 'quarantine', label: 'Quarantine',        icon: Lock },
  { id: 'backups',    label: 'Backups',           icon: HardDrive },
  { id: 'logs',       label: 'Logs',              icon: ScrollText },
  { id: 'awareness',  label: 'Human Awareness',   icon: Users },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-screen border-r" style={{ background: '#D1BFA2', borderColor: '#C2A68D' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ background: '#FFFFFF', borderColor: '#C2A68D' }}>
        <div className="relative">
          <Shield size={28} style={{ color: '#2d6a4f' }} strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: '#1a1a1a' }}>SentinelShield</p>
          <p className="text-xs font-mono tracking-widest" style={{ color: '#6b5a45' }}>AI</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {nav.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group border"
              style={isActive
                ? { background: '#C2A68D', color: '#1a1a1a', borderColor: '#BFAF8D' }
                : { background: 'transparent', color: '#3d3020', borderColor: 'transparent' }
              }
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#C2A68D'; e.currentTarget.style.color = '#1a1a1a' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3d3020' } }}
            >
              <Icon
                size={16}
                style={{ color: isActive ? '#1a1a1a' : '#6b5a45' }}
              />
              <span className="font-medium">{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#1a1a1a' }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: '#C2A68D' }}>
        <p className="text-xs font-mono" style={{ color: '#6b5a45' }}>v2.4.1-beta</p>
        <p className="text-xs mt-0.5" style={{ color: '#6b5a45' }}>© 2026 SentinelShield</p>
      </div>
    </aside>
  )
}
