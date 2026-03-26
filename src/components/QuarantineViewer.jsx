import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Lock, Trash2, RotateCcw, RefreshCw, AlertTriangle, CheckCircle, ShieldCheck, ShieldAlert } from 'lucide-react'

const levelColor = { CRITICAL: '#c0392b', HIGH: '#b7770d', MEDIUM: '#2F80ED' }

function guessLevel(name) {
  if (name.endsWith('.locked')) return 'CRITICAL'
  if (name.endsWith('.ps1') || name.endsWith('.exe')) return 'HIGH'
  return 'MEDIUM'
}

export default function QuarantineViewer({ onRefresh }) {
  const [files, setFiles]         = useState([])
  const [integrity, setIntegrity] = useState({})
  const [loading, setLoading]     = useState(false)
  const [busy, setBusy]           = useState({})
  const [toast, setToast]         = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    setLoading(true)
    const [d, integ] = await Promise.all([
      api.quarantine(),
      fetch('http://localhost:8000/quarantine/integrity').then(r => r.json()).catch(() => ({}))
    ])
    setFiles((d?.files ?? []).map(f => ({ name: f, level: guessLevel(f) })))
    setIntegrity(integ?.files ?? {})
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const doRestore = async (name) => {
    setBusy(b => ({ ...b, [name]: 'restore' }))
    const r = await api.restoreQuarantine(name)
    setBusy(b => ({ ...b, [name]: null }))
    if (r?.restored) { showToast(`${name} restored`); load(); onRefresh?.() }
    else if (r === null) showToast('Backend offline', false)
    else showToast(r?.detail ?? 'Failed to restore', false)
  }

  const doDelete = async (name) => {
    if (!confirm(`Permanently delete ${name}?`)) return
    setBusy(b => ({ ...b, [name]: 'delete' }))
    const r = await api.deleteQuarantine(name)
    setBusy(b => ({ ...b, [name]: null }))
    if (r?.deleted) { showToast(`${name} deleted`); load() }
    else showToast(r?.detail ?? 'Failed to delete', false)
  }

  return (
    <div className="rounded-xl p-5 flex flex-col h-full relative" style={{ background: '#ffffff', border: '1px solid #D1BFA2' }}>
      {toast && (
        <div className={`absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
          toast.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Lock size={14} style={{ color: '#c0392b' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Quarantine</p>
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)' }}>
          {files.length} files
        </span>
        <button onClick={load} className="ml-auto" style={{ color: '#6b5a45' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-center" style={{ color: '#6b5a45' }}>
            {loading ? 'Loading...' : 'No quarantined files'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #D1BFA2' }}>
                {['File Name', 'Threat', 'Integrity', 'Actions'].map(h => (
                  <th key={h} className="text-left pb-2 pr-3 font-semibold uppercase tracking-wider" style={{ color: '#6b5a45' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => {
                const color    = levelColor[f.level] ?? '#6b5a45'
                const isBusy   = busy[f.name]
                const integ    = integrity[f.name]
                const tampered = integ?.tampered
                return (
                  <tr key={i} className="hover:bg-[#F5F5DC] transition-colors" style={{ borderBottom: '1px solid #F5F5DC' }}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={11} style={{ color }} />
                        <span className="font-mono truncate max-w-[140px]" style={{ color: '#1a1a1a' }}>{f.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
                        {f.level}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {integ ? (
                        <div className="flex items-center gap-1">
                          {tampered
                            ? <><ShieldAlert size={12} style={{ color: '#c0392b' }} /><span style={{ color: '#c0392b' }} className="text-xs font-medium">TAMPERED</span></>
                            : <><ShieldCheck size={12} style={{ color: '#2d6a4f' }} /><span style={{ color: '#2d6a4f' }} className="text-xs font-medium">Verified</span></>
                          }
                        </div>
                      ) : (
                        <span style={{ color: '#BFAF8D' }} className="text-xs">No record</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => doRestore(f.name)}
                          disabled={!!isBusy || tampered}
                          className="flex items-center gap-1 transition-colors disabled:opacity-40"
                          style={{ color: tampered ? '#BFAF8D' : '#2d6a4f' }}
                          title={tampered ? 'Restore blocked — file was tampered by attacker' : 'Restore to sandbox'}
                        >
                          <RotateCcw size={11} className={isBusy === 'restore' ? 'animate-spin' : ''} />
                          Restore
                        </button>
                        <button
                          onClick={() => doDelete(f.name)}
                          disabled={!!isBusy || tampered}
                          className="flex items-center gap-1 transition-colors disabled:opacity-40"
                          style={{ color: tampered ? '#BFAF8D' : '#c0392b' }}
                          title={tampered ? 'Delete blocked — file was tampered by attacker' : 'Permanently delete'}
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
