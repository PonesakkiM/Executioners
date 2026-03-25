import { useState } from 'react'
import { Settings } from 'lucide-react'

function Toggle({ label, desc, on, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#1a2d4a]">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-[#4a6080] text-xs mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!on)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{ background: on ? '#00FFB2' : '#1a2d4a' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
          style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [s, setS] = useState({ rt: true, auto: true, backup: true, email: false, net: true })
  const set = k => v => setS(p => ({ ...p, [k]: v }))
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5 max-w-2xl">
      <div className="flex items-center gap-2 mb-5">
        <Settings size={16} className="text-[#4a6080]" />
        <p className="text-white font-semibold text-lg">Settings</p>
      </div>
      <div className="glass rounded-xl px-5">
        <Toggle label="Real-time threat detection"     desc="Monitor all endpoints continuously"                    on={s.rt}     onChange={set('rt')} />
        <Toggle label="Auto-quarantine critical threats" desc="Isolate files with CRITICAL severity automatically"  on={s.auto}   onChange={set('auto')} />
        <Toggle label="File recovery backups"           desc="Keep encrypted snapshots for recovery"               on={s.backup} onChange={set('backup')} />
        <Toggle label="Email alerts"                    desc="Send notifications for HIGH and CRITICAL events"      on={s.email}  onChange={set('email')} />
        <Toggle label="Network traffic analysis"        desc="Deep packet inspection on all nodes"                  on={s.net}    onChange={set('net')} />
      </div>
    </div>
  )
}
