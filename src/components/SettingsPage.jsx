import { useState } from 'react'
import { Settings } from 'lucide-react'

function Toggle({ label, desc, on, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: '#D1BFA2' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6b5a45' }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!on)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{ background: on ? '#C2A68D' : '#D1BFA2' }}
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
        <Settings size={16} style={{ color: '#6b5a45' }} />
        <p className="font-semibold text-lg" style={{ color: '#1a1a1a' }}>Settings</p>
      </div>
      <div className="rounded-xl px-5" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
        <Toggle label="Real-time threat detection"      desc="Monitor all endpoints continuously"                   on={s.rt}     onChange={set('rt')} />
        <Toggle label="Auto-quarantine critical threats" desc="Isolate files with CRITICAL severity automatically"  on={s.auto}   onChange={set('auto')} />
        <Toggle label="File recovery backups"            desc="Keep encrypted snapshots for recovery"              on={s.backup} onChange={set('backup')} />
        <Toggle label="Email alerts"                     desc="Send notifications for HIGH and CRITICAL events"    on={s.email}  onChange={set('email')} />
        <Toggle label="Network traffic analysis"         desc="Deep packet inspection on all nodes"                on={s.net}    onChange={set('net')} />
      </div>
    </div>
  )
}
