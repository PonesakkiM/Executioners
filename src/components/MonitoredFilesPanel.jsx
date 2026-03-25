import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { FileText, Lock, Shield, RefreshCw, AlertTriangle, Eye, FolderOpen, ShieldAlert, CheckCircle } from 'lucide-react'
import FileModal from './FileModal'

const statusStyle = {
  normal:    { color: '#00FFB2', bg: 'rgba(0,255,178,0.06)',  border: 'rgba(0,255,178,0.15)',  icon: FileText  },
  encrypted: { color: '#FF3B3B', bg: 'rgba(255,59,59,0.08)',  border: 'rgba(255,59,59,0.3)',   icon: Lock      },
  canary:    { color: '#F2C94C', bg: 'rgba(242,201,76,0.06)', border: 'rgba(242,201,76,0.15)', icon: Shield    },
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
    // Auto-refresh every 3s so attacked files appear immediately
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [])

  const attackedFiles  = files.filter(f => f.status === 'encrypted')
  const normalFiles    = files.filter(f => f.status === 'normal')
  const canaryFiles    = files.filter(f => f.status === 'canary')

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
      <div className="glass rounded-xl p-5 flex flex-col h-full relative">

        {/* Toast */}
        {toast && (
          <div className={`absolute top-3 left-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
            toast.ok
              ? 'bg-[#00FFB2]/10 border-[#00FFB2]/30 text-[#00FFB2]'
              : 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30 text-[#FF3B3B]'
          }`}>
            {toast.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={14} className="text-[#00FFB2]" />
          <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Monitored Files</p>
          <div className="ml-auto flex items-center gap-2">
            {attackedFiles.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-[#FF3B3B] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 px-2 py-0.5 rounded-full animate-pulse">
                <AlertTriangle size={10} /> {attackedFiles.length} encrypted
              </span>
            )}
            <span className="text-xs text-[#00FFB2]">{normalFiles.length} safe</span>
            <button onClick={load} className="text-[#4a6080] hover:text-white transition-colors">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Quarantine all attacked button — only shows when there are attacked files */}
        {attackedFiles.length > 0 && (
          <button
            onClick={quarantineAll}
            disabled={quarantining}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold mb-3 transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{
              color: '#FF3B3B',
              background: 'rgba(255,59,59,0.1)',
              border: '1px solid rgba(255,59,59,0.35)',
              boxShadow: '0 0 20px rgba(255,59,59,0.15)',
            }}
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
            <p className="text-[#4a6080] text-xs text-center py-6">
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

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-mono truncate">{f.name}</p>
                  <p className="text-[#4a6080] text-xs">{(f.size / 1024).toFixed(1)} KB</p>
                </div>

                {/* Status badge */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                  style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}30` }}
                >
                  {f.status}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* View button */}
                  <button
                    onClick={() => setSelected(f)}
                    title="View file content"
                    className="p-1.5 rounded-lg transition-colors hover:bg-[#2F80ED]/20"
                  >
                    <Eye size={12} className="text-[#2a3d55] group-hover:text-[#2F80ED] transition-colors" />
                  </button>

                  {/* Quarantine single file button — only for encrypted */}
                  {f.status === 'encrypted' && (
                    <button
                      onClick={() => quarantineOne(f.name)}
                      title="Move to quarantine"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[#FF3B3B]/20"
                    >
                      <ShieldAlert size={12} className="text-[#FF3B3B]/50 hover:text-[#FF3B3B] transition-colors" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1a2d4a]">
          {[
            ['#00FFB2', 'Normal'],
            ['#FF3B3B', 'Encrypted'],
            ['#F2C94C', 'Canary'],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-[#4a6080]">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* File viewer modal */}
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
