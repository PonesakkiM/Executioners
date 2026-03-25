import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Lock, Trash2, RotateCcw, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

const levelColor = { CRITICAL: '#FF3B3B', HIGH: '#F2C94C', MEDIUM: '#2F80ED' }

function guessLevel(name) {
  if (name.endsWith('.locked')) return 'CRITICAL'
  if (name.endsWith('.ps1') || name.endsWith('.exe')) return 'HIGH'
  return 'MEDIUM'
}

export default function QuarantineViewer({ onRefresh }) {
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy]       = useState({})
  const [toast, setToast]     = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    const d = await api.quarantine()
    setFiles((d?.files ?? []).map(f => ({ name: f, level: guessLevel(f) })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const doRestore = async (name) => {
    setBusy(b => ({ ...b, [name]: 'restore' }))
    const r = await api.restoreQuarantine(name)
    setBusy(b => ({ ...b, [name]: null }))
    if (r?.restored) { showToast(`${name} restored to sandbox`); load(); onRefresh?.() }
    else showToast(`Failed to restore ${name}`, false)
  }

  const doDelete = async (name) => {
    if (!confirm(`Permanently delete ${name}?`)) return
    setBusy(b => ({ ...b, [name]: 'delete' }))
    await api.deleteQuarantine(name)
    setBusy(b => ({ ...b, [name]: null }))
    showToast(`${name} permanently deleted`)
    load()
  }

  return (
    <div className="glass rounded-xl p-5 flex flex-col h-full relative">
      {/* Toast */}
      {toast && (
        <div className={`absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
          toast.ok ? 'bg-[#00FFB2]/10 border-[#00FFB2]/30 text-[#00FFB2]' : 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30 text-[#FF3B3B]'
        }`}>
          {toast.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Lock size={14} className="text-[#FF3B3B]" />
        <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Quarantine</p>
        <span className="ml-2 text-xs text-[#FF3B3B] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 px-2 py-0.5 rounded-full">
          {files.length} files
        </span>
        <button onClick={load} className="ml-auto text-[#4a6080] hover:text-white transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#4a6080] text-xs text-center">
            {loading ? 'Loading...' : 'No quarantined files'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a2d4a]">
                {['File Name', 'Threat Level', 'Actions'].map(h => (
                  <th key={h} className="text-left pb-2 text-[#2a3d55] font-medium uppercase tracking-wider pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d1f35]">
              {files.map((f, i) => {
                const color = levelColor[f.level] ?? '#4a6080'
                const isBusy = busy[f.name]
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={11} style={{ color }} />
                        <span className="text-white font-mono truncate max-w-[160px]">{f.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
                        {f.level}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => doRestore(f.name)}
                          disabled={!!isBusy}
                          className="flex items-center gap-1 text-[#2F80ED] hover:text-white transition-colors disabled:opacity-40"
                        >
                          <RotateCcw size={11} className={isBusy === 'restore' ? 'animate-spin' : ''} />
                          Restore
                        </button>
                        <button
                          onClick={() => doDelete(f.name)}
                          disabled={!!isBusy}
                          className="flex items-center gap-1 text-[#FF3B3B] hover:text-white transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={11} className={isBusy === 'delete' ? 'animate-spin' : ''} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
