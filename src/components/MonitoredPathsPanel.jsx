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
    <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen size={14} style={{ color: '#2d6a4f' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Monitored Directories</p>
        <span className="ml-auto text-xs" style={{ color: '#2d6a4f' }}>{paths.filter(p=>p.active).length} active</span>
      </div>

      <div className="space-y-2 mb-3">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#C2A68D'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#D1BFA2'}
          >
            <Shield size={13} style={{ color: p.active ? '#2d6a4f' : '#C2A68D' }} />
            <span className="flex-1 text-sm font-mono truncate" style={{ color: p.active ? '#1a1a1a' : '#6b5a45' }}>{p.path}</span>
            <button onClick={() => toggle(i)} className="shrink-0 transition-colors">
              {p.active
                ? <ToggleRight size={20} style={{ color: '#2d6a4f' }} />
                : <ToggleLeft  size={20} style={{ color: '#C2A68D' }} />
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
          className="flex-1 rounded-lg px-3 py-2 text-xs placeholder-[#C2A68D] focus:outline-none font-mono transition-colors"
          style={{ background: '#F5F5DC', border: '1px solid #D1BFA2', color: '#1a1a1a' }}
          onFocus={e => e.target.style.borderColor = '#C2A68D'}
          onBlur={e => e.target.style.borderColor = '#D1BFA2'}
        />
        <button
          onClick={addPath}
          disabled={adding}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
          style={{ color: '#C2A68D', border: '1px solid #C2A68D', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#D1BFA2'; e.currentTarget.style.color = '#1a1a1a' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C2A68D' }}
        >
          {adding ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
          Add
        </button>
      </div>
    </div>
  )
}
