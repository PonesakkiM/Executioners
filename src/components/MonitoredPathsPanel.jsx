import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { FolderOpen, Plus, RefreshCw, ToggleLeft, ToggleRight, Shield } from 'lucide-react'

const DEFAULT_PATHS = [
  { path: 'Documents',  active: true  },
  { path: 'Downloads',  active: true  },
  { path: 'Desktop',    active: true  },
]

export default function MonitoredPathsPanel() {
  const [paths, setPaths] = useState(DEFAULT_PATHS)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.status().then(d => {
      if (d?.monitored_paths?.length) {
        setPaths(d.monitored_paths.map(p => ({ path: p, active: true })))
      }
    })
  }, [])

  const toggle = (i) => setPaths(prev => prev.map((p, idx) => idx === i ? { ...p, active: !p.active } : p))

  const addPath = async () => {
    if (!input.trim()) return
    setAdding(true)
    await api.addPath(input.trim())
    setPaths(prev => [...prev, { path: input.trim(), active: true }])
    setInput('')
    setAdding(false)
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen size={14} className="text-[#00FFB2]" />
        <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Monitored Directories</p>
        <span className="ml-auto text-xs text-[#00FFB2]">{paths.filter(p=>p.active).length} active</span>
      </div>

      <div className="space-y-2 mb-3">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0a1628] border border-[#1a2d4a] hover:border-[#2a3d55] transition-colors">
            <Shield size={13} className={p.active ? 'text-[#00FFB2]' : 'text-[#2a3d55]'} />
            <span className={`flex-1 text-sm font-mono truncate ${p.active ? 'text-white' : 'text-[#2a3d55]'}`}>{p.path}</span>
            <button onClick={() => toggle(i)} className="shrink-0 transition-colors">
              {p.active
                ? <ToggleRight size={20} className="text-[#00FFB2]" />
                : <ToggleLeft  size={20} className="text-[#2a3d55]" />
              }
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPath()}
          placeholder="/path/to/directory"
          className="flex-1 bg-[#0a1628] border border-[#1a2d4a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#2a3d55] focus:outline-none focus:border-[#2F80ED] transition-colors font-mono"
        />
        <button
          onClick={addPath}
          disabled={adding}
          className="flex items-center gap-1.5 text-xs bg-[#2F80ED]/10 border border-[#2F80ED]/30 text-[#2F80ED] px-3 py-2 rounded-lg hover:bg-[#2F80ED]/20 transition-colors disabled:opacity-40"
        >
          {adding ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
          Add
        </button>
      </div>
    </div>
  )
}
