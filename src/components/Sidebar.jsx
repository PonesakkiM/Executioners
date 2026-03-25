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
    <aside className="w-[220px] shrink-0 flex flex-col h-screen bg-[#070f1e] border-r border-[#1a2d4a]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1a2d4a]">
        <div className="relative">
          <Shield size={28} className="text-[#00FFB2]" strokeWidth={1.5} />
          <span className="absolute inset-0 rounded-full animate-pulse-green opacity-60" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">SentinelShield</p>
          <p className="text-[#00FFB2] text-xs font-mono tracking-widest">AI</p>
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
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                ${isActive
                  ? 'bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20'
                  : 'text-[#4a6080] hover:text-white hover:bg-white/5 border border-transparent'}
              `}
            >
              <Icon
                size={16}
                className={`transition-all ${isActive ? 'text-[#00FFB2]' : 'group-hover:text-[#2F80ED]'}`}
              />
              <span className="font-medium">{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00FFB2] animate-pulse" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1a2d4a]">
        <p className="text-[#2a3d55] text-xs font-mono">v2.4.1-beta</p>
        <p className="text-[#2a3d55] text-xs mt-0.5">© 2026 SentinelShield</p>
      </div>
    </aside>
  )
}
