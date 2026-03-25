import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import {
  HardDrive, RotateCcw, CheckCircle, Plus, Clock,
  ChevronDown, ChevronRight, FileText, Lock, Shield, RefreshCw
} from 'lucide-react'

const DUMMY = [
  { snapshot_id: 'snap_demo_1', created_at: new Date(Date.now()-3600000).toISOString(), file_count: 5, restore_status: 'available' },
  { snapshot_id: 'snap_demo_2', created_at: new Date(Date.now()-1800000).toISOString(), file_count: 5, restore_status: 'available' },
]

function FileRow({ f }) {
  const color  = f.status === 'encrypted' ? '#FF3B3B' : f.status === 'canary' ? '#F2C94C' : '#00FFB2'
  const Icon   = f.status === 'encrypted' ? Lock : f.status === 'canary' ? Shield : FileText
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.02] rounded transition-colors">
      <Icon size={11} style={{ color }} className="shrink-0" />
      <span className="text-xs font-mono flex-1 truncate" style={{ color: f.status === 'clean' ? '#8ba0b8' : color }}>
        {f.name}
      </span>
      <span className="text-xs shrink-0" style={{ color: '#2a3d55' }}>
        {(f.size / 1024).toFixed(1)} KB
      </span>
      <span
        className="text-xs px-1.5 py-0.5 rounded shrink-0"
        style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}
      >
        {f.status}
      </span>
    </div>
  )
}

function SnapshotRow({ snap, onRestore, restoring }) {
  const [expanded, setExpanded]   = useState(false)
  const [files, setFiles]         = useState(null)
  const [loadingFiles, setLoadingFiles] = useState(false)

  const toggle = async () => {
    if (!expanded && files === null) {
      setLoadingFiles(true)
      const d = await api.snapshotFiles(snap.snapshot_id)
      setFiles(d?.files ?? [])
      setLoadingFiles(false)
    }
    setExpanded(e => !e)
  }

  const isRestored = snap.restore_status === 'restored'
  const dotColor   = isRestored ? '#00FFB2' : '#2F80ED'
  const cleanFiles = files?.filter(f => f.status === 'clean') ?? []
  const lockedFiles = files?.filter(f => f.status === 'encrypted') ?? []

  return (
    <div className="border border-[#1a2d4a] rounded-xl overflow-hidden mb-2">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0a1628] hover:bg-[#0d1f35] transition-colors">
        {/* Expand toggle */}
        <button onClick={toggle} className="text-[#4a6080] hover:text-white transition-colors shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Dot */}
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Clock size={11} className="text-[#4a6080]" />
            <span className="text-white text-xs font-mono">
              {new Date(snap.created_at).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="text-[#2a3d55] text-xs">
              {new Date(snap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-[#2a3d55] text-xs font-mono truncate mt-0.5">{snap.snapshot_id}</p>
        </div>

        {/* File count */}
        <span className="text-xs text-[#4a6080] shrink-0">{snap.file_count} files</span>

        {/* Restore button */}
        {isRestored ? (
          <span className="flex items-center gap-1 text-xs text-[#00FFB2] shrink-0">
            <CheckCircle size={11} /> Restored
          </span>
        ) : (
          <button
            onClick={() => onRestore(snap.snapshot_id)}
            disabled={restoring === snap.snapshot_id}
            className="flex items-center gap-1 text-xs text-[#2F80ED] border border-[#2F80ED]/20 px-2 py-1 rounded-lg hover:bg-[#2F80ED]/10 transition-colors disabled:opacity-40 shrink-0"
          >
            <RotateCcw size={10} className={restoring === snap.snapshot_id ? 'animate-spin' : ''} />
            Restore
          </button>
        )}
      </div>

      {/* Expanded file list */}
      {expanded && (
        <div className="border-t border-[#1a2d4a] bg-[#050d1a]">
          {loadingFiles ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#4a6080]">
              <RefreshCw size={12} className="animate-spin" /> Loading files...
            </div>
          ) : files?.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[#2a3d55]">No files in this snapshot</p>
          ) : (
            <div className="py-2">
              {/* Summary bar */}
              <div className="flex items-center gap-4 px-4 py-2 border-b border-[#0d1f35] mb-1">
                <span className="text-xs text-[#00FFB2]">✓ {cleanFiles.length} clean</span>
                {lockedFiles.length > 0 && (
                  <span className="text-xs text-[#FF3B3B]">✗ {lockedFiles.length} encrypted</span>
                )}
                <span className="text-xs text-[#2a3d55] ml-auto">{files.length} total</span>
              </div>
              {/* File rows */}
              <div className="px-2">
                {files.map((f, i) => <FileRow key={i} f={f} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BackupSnapshotPanel() {
  const [snaps, setSnaps]       = useState(DUMMY)
  const [restoring, setRestoring] = useState(null)
  const [loading, setLoading]   = useState(false)

  const load = () => {
    setLoading(true)
    // Try DB first, fall back to local
    supabase.from('backup_snapshots').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data?.length) { setSnaps(data); setLoading(false); return }
        // Fall back to local snapshots API
        api.snapshots().then(d => {
          const local = d?.local ?? []
          if (local.length) {
            setSnaps(local.map(id => ({
              snapshot_id:    id,
              created_at:     new Date(parseInt(id.split('_')[1]) * 1000).toISOString(),
              file_count:     0,
              restore_status: 'available',
            })))
          }
          setLoading(false)
        })
      })
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('snaps_ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'backup_snapshots' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const restore = async (id) => {
    setRestoring(id)
    await api.restore(id)
    load()
    setRestoring(null)
  }

  return (
    <div className="glass rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive size={14} className="text-[#2F80ED]" />
        <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Backup Snapshots</p>
        <span className="text-xs text-[#4a6080] ml-1">— click to see protected files</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load} className="text-[#4a6080] hover:text-white transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => api.takeSnapshot().then(load)}
            className="flex items-center gap-1 text-xs text-[#00FFB2] border border-[#00FFB2]/20 px-2 py-1 rounded-lg hover:bg-[#00FFB2]/10 transition-colors"
          >
            <Plus size={11} /> New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {snaps.length === 0 ? (
          <p className="text-[#4a6080] text-xs text-center py-6">No snapshots yet — click New to create one</p>
        ) : (
          snaps.map(s => (
            <SnapshotRow
              key={s.snapshot_id}
              snap={s}
              onRestore={restore}
              restoring={restoring}
            />
          ))
        )}
      </div>
    </div>
  )
}
