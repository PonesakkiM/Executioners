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
  const color  = f.status === 'encrypted' ? '#c0392b' : f.status === 'canary' ? '#b7770d' : '#2d6a4f'
  const Icon   = f.status === 'encrypted' ? Lock : f.status === 'canary' ? Shield : FileText
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors"
      style={{ color: '#3d3020' }}
      onMouseEnter={e => e.currentTarget.style.background = '#F5F5DC'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={11} style={{ color }} className="shrink-0" />
      <span className="text-xs font-mono flex-1 truncate" style={{ color: f.status === 'clean' ? '#3d3020' : color }}>
        {f.name}
      </span>
      <span className="text-xs shrink-0" style={{ color: '#6b5a45' }}>
        {(f.size / 1024).toFixed(1)} KB
      </span>
      <span
        className="text-xs px-1.5 py-0.5 rounded shrink-0"
        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
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
  const dotColor   = isRestored ? '#2d6a4f' : '#C2A68D'
  const cleanFiles = files?.filter(f => f.status === 'clean') ?? []
  const lockedFiles = files?.filter(f => f.status === 'encrypted') ?? []

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid #D1BFA2' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 transition-colors"
        style={{ background: '#F5F5DC' }}
        onMouseEnter={e => e.currentTarget.style.background = '#EDE8D8'}
        onMouseLeave={e => e.currentTarget.style.background = '#F5F5DC'}
      >
        <button onClick={toggle} className="transition-colors shrink-0" style={{ color: '#6b5a45' }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Clock size={11} style={{ color: '#6b5a45' }} />
            <span className="text-xs font-mono" style={{ color: '#1a1a1a' }}>
              {new Date(snap.created_at).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="text-xs" style={{ color: '#6b5a45' }}>
              {new Date(snap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs font-mono truncate mt-0.5" style={{ color: '#6b5a45' }}>{snap.snapshot_id}</p>
        </div>

        <span className="text-xs shrink-0" style={{ color: '#6b5a45' }}>{snap.file_count} files</span>

        {isRestored ? (
          <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: '#2d6a4f' }}>
            <CheckCircle size={11} /> Restored
          </span>
        ) : (
          <button
            onClick={() => onRestore(snap.snapshot_id)}
            disabled={restoring === snap.snapshot_id}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-40 shrink-0"
            style={{ color: '#C2A68D', border: '1px solid #C2A68D', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#D1BFA2'; e.currentTarget.style.color = '#1a1a1a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C2A68D' }}
          >
            <RotateCcw size={10} className={restoring === snap.snapshot_id ? 'animate-spin' : ''} />
            Restore
          </button>
        )}
      </div>

      {/* Expanded file list */}
      {expanded && (
        <div className="border-t" style={{ borderColor: '#D1BFA2', background: '#FFFFFF' }}>
          {loadingFiles ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: '#6b5a45' }}>
              <RefreshCw size={12} className="animate-spin" /> Loading files...
            </div>
          ) : files?.length === 0 ? (
            <p className="px-4 py-3 text-xs" style={{ color: '#6b5a45' }}>No files in this snapshot</p>
          ) : (
            <div className="py-2">
              <div className="flex items-center gap-4 px-4 py-2 mb-1 border-b" style={{ borderColor: '#D1BFA2' }}>
                <span className="text-xs" style={{ color: '#2d6a4f' }}>✓ {cleanFiles.length} clean</span>
                {lockedFiles.length > 0 && (
                  <span className="text-xs" style={{ color: '#c0392b' }}>✗ {lockedFiles.length} encrypted</span>
                )}
                <span className="text-xs ml-auto" style={{ color: '#6b5a45' }}>{files.length} total</span>
              </div>
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
    supabase.from('backup_snapshots').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data?.length) { setSnaps(data); setLoading(false); return }
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
    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
      <div className="flex items-center gap-2 mb-4">
        <HardDrive size={14} style={{ color: '#C2A68D' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Backup Snapshots</p>
        <span className="text-xs ml-1" style={{ color: '#6b5a45' }}>— click to see protected files</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load} className="transition-colors" style={{ color: '#6b5a45' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => api.takeSnapshot().then(load)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: '#2d6a4f', border: '1px solid #2d6a4f', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#d4edda' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Plus size={11} /> New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {snaps.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: '#6b5a45' }}>No snapshots yet — click New to create one</p>
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
