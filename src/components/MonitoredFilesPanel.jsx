import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { FileText, Lock, Shield, RefreshCw, AlertTriangle, Eye, FolderOpen, ShieldAlert, CheckCircle } from 'lucide-react'
import FileModal from './FileModal'

const statusStyle = {
  normal:    { color: '#2d6a4f', bg: '#d4edda',  border: '#a8d5b5',  icon: FileText  },
  encrypted: { color: '#c0392b', bg: '#fde8e6',  border: '#f5c6c2',  icon: Lock      },
  canary:    { color: '#b7770d', bg: '#fef3cd',  border: '#fde68a',  icon: Shield    },
}

export default function MonitoredFilesPanel({ onRefresh }) {
  const [files, setFiles]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [quarantining, setQuarantining] = useState(false)
  const [toast, setToast]         = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    setLoading(true)
    const [fd, sd] = await Promise.all([api.listFiles(), api.snapshots()])
    if (fd?.files) setFiles(fd.files)
    const dbSnaps = sd?.db ?? []
    const local   = sd?.local ?? []
    const merged  = dbSnaps.length
      ? dbSnaps
      : local.map(id => ({ snapshot_id: id, created_at: new Date().toISOString(), file_count: 0 }))
    setSnapshots(merged)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [])

  const attackedFiles  = files.filter(f => f.status === 'encrypted')
  const normalFiles    = files.filter(f => f.status === 'normal')

  const quarantineAll = async () => {
    setQuarantining(true)
    const r = await api.quarantineAttacked()
    if (r?.count > 0) {
      showToast(`${r.count} attacked file${r.count > 1 ? 's' : ''} moved to quarantine`)
      load()
      onRefresh?.()
    } else {
      showToast('No attacked files found', false)
    }
    setQuarantining(false)
  }

  const quarantineOne = async (fname) => {
    const r = await api.quarantineFile(fname)
    if (r?.quarantined) {
      showToast(`${fname} quarantined`)
      load()
      onRefresh?.()
    }
  }

  return (
    <>
      <div className="rounded-xl p-5 flex flex-col h-full relative" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>

        {/* Toast */}
        {toast && (
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
            style={toast.ok
              ? { background: '#d4edda', borderColor: '#2d6a4f', color: '#2d6a4f' }
              : { background: '#fde8e6', borderColor: '#c0392b', color: '#c0392b' }
            }>
            {toast.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={14} style={{ color: '#2d6a4f' }} />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Monitored Files</p>
          <div className="ml-auto flex items-center gap-2">
            {attackedFiles.length > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full animate-pulse"
                style={{ color: '#c0392b', background: '#fde8e6', border: '1px solid #f5c6c2' }}>
                <AlertTriangle size={10} /> {attackedFiles.length} encrypted
              </span>
            )}
            <span className="text-xs" style={{ color: '#2d6a4f' }}>{normalFiles.length} safe</span>
            <button onClick={load} className="transition-colors" style={{ color: '#6b5a45' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Quarantine all attacked button */}
        {attackedFiles.length > 0 && (
          <button
            onClick={quarantineAll}
            disabled={quarantining}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold mb-3 transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{ color: '#c0392b', background: '#fde8e6', border: '1px solid #c0392b' }}
          >
            {quarantining
              ? <RefreshCw size={14} className="animate-spin" />
              : <ShieldAlert size={14} />
            }
            {quarantining
              ? 'Quarantining...'
              : `Quarantine All ${attackedFiles.length} Attacked File${attackedFiles.length > 1 ? 's' : ''}`
            }
          </button>
        )}

        {/* File list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5">
          {files.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: '#6b5a45' }}>
              {loading ? 'Loading files...' : 'No files — backend may be offline'}
            </p>
          )}

          {files.map((f, i) => {
            const s = statusStyle[f.status] ?? statusStyle.normal
            const Icon = s.icon
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <Icon size={14} style={{ color: s.color }} className="shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate" style={{ color: '#1a1a1a' }}>{f.name}</p>
                  <p className="text-xs" style={{ color: '#6b5a45' }}>{(f.size / 1024).toFixed(1)} KB</p>
                </div>

                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                  style={{ color: s.color, background: '#FFFFFF', border: `1px solid ${s.color}` }}
                >
                  {f.status}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelected(f)}
                    title="View file content"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: '#6b5a45' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#D1BFA2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Eye size={12} />
                  </button>

                  {f.status === 'encrypted' && (
                    <button
                      onClick={() => quarantineOne(f.name)}
                      title="Move to quarantine"
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: '#c0392b' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fde8e6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <ShieldAlert size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: '#D1BFA2' }}>
          {[
            ['#2d6a4f', 'Normal'],
            ['#c0392b', 'Encrypted'],
            ['#b7770d', 'Canary'],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#6b5a45' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {selected && (
        <FileModal
          file={selected}
          snapshots={snapshots}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
