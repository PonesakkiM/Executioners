import { useEffect, useState, Component } from 'react'
import { api } from '../lib/api'
import {
  X, FileText, Lock, AlertTriangle, ChevronLeft, ChevronRight,
  Eye, GitCompare, ShieldCheck, ShieldAlert, RefreshCw
} from 'lucide-react'

// ── Error boundary ────────────────────────────────────────────────────────────
class ModalErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center space-y-4"
          style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
          <AlertTriangle size={32} style={{ color: '#c0392b' }} className="mx-auto" />
          <p className="font-semibold" style={{ color: '#1a1a1a' }}>Failed to render file viewer</p>
          <p className="text-xs font-mono" style={{ color: '#6b5a45' }}>{this.state.error?.message}</p>
          <button onClick={this.props.onClose}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: '#D1BFA2', border: '1px solid #C2A68D', color: '#1a1a1a' }}>
            Close
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}

// ── Safe line renderer ────────────────────────────────────────────────────────
function LineBlock({ lines = [], compareLines = [], color = '#3d3020', borderColor = '#D1BFA2', emptyMsg = 'No content' }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-lg border font-mono text-xs"
        style={{ borderColor, background: '#F5F5DC' }}>
        <p style={{ color: '#6b5a45' }}>{emptyMsg}</p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border overflow-auto font-mono text-xs" style={{ borderColor, background: '#F5F5DC', maxHeight: 260 }}>
      {lines.map((l, i) => {
        const raw = typeof l === 'string' ? l.replace(/\n$/, '') : String(l ?? '')
        const changed = compareLines.length > 0 && raw !== (typeof compareLines[i] === 'string' ? compareLines[i].replace(/\n$/, '') : '')
        return (
          <div key={i} className="flex px-3 py-0.5"
            style={{ background: changed ? `${color}12` : undefined }}
            onMouseEnter={e => e.currentTarget.style.background = '#EDE8D8'}
            onMouseLeave={e => e.currentTarget.style.background = changed ? `${color}12` : 'transparent'}
          >
            <span className="w-8 shrink-0 select-none text-right mr-3" style={{ color: '#C2A68D' }}>{i + 1}</span>
            <span style={{ color: changed ? color : '#3d3020' }}>{raw}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Diff view ─────────────────────────────────────────────────────────────────
function DiffView({ diff = [], beforeLines = [], afterLines = [], beforeSize = 0, afterSize = 0, isLocked = false }) {
  const [view, setView] = useState('split')

  const safeBefore = Array.isArray(beforeLines) ? beforeLines : []
  const safeAfter  = Array.isArray(afterLines)  ? afterLines  : []
  const safeDiff   = Array.isArray(diff)         ? diff        : []

  const tabs = [
    { id: 'split',  label: 'Side by Side' },
    { id: 'diff',   label: 'Unified Diff' },
    { id: 'before', label: `Before (${((beforeSize || 0) / 1024).toFixed(1)} KB)` },
    { id: 'after',  label: `After (${((afterSize  || 0) / 1024).toFixed(1)} KB)` },
  ]

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden mb-4 w-fit" style={{ border: '1px solid #D1BFA2' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={view === t.id
              ? { background: '#C2A68D', color: '#1a1a1a' }
              : { background: '#F5F5DC', color: '#6b5a45' }
            }
            onMouseEnter={e => { if (view !== t.id) e.currentTarget.style.color = '#1a1a1a' }}
            onMouseLeave={e => { if (view !== t.id) e.currentTarget.style.color = '#6b5a45' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'split' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={13} style={{ color: '#2d6a4f' }} />
              <span className="text-xs font-semibold" style={{ color: '#2d6a4f' }}>BEFORE ATTACK</span>
            </div>
            <LineBlock lines={safeBefore} borderColor="#a8d5b5"
              emptyMsg="No snapshot — take one before attacking" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={13} style={{ color: '#c0392b' }} />
              <span className="text-xs font-semibold" style={{ color: '#c0392b' }}>
                AFTER ATTACK {isLocked ? '(Encrypted)' : '(Modified)'}
              </span>
            </div>
            <LineBlock lines={safeAfter} compareLines={safeBefore}
              color="#c0392b" borderColor="#f5c6c2"
              emptyMsg="File not in sandbox (quarantined?)" />
          </div>
        </div>
      )}

      {view === 'diff' && (
        <div className="rounded-lg border overflow-auto font-mono text-xs" style={{ background: '#F5F5DC', borderColor: '#D1BFA2', maxHeight: 320 }}>
          {safeDiff.length === 0
            ? <p className="p-4" style={{ color: '#6b5a45' }}>No diff — files may be identical or no snapshot available</p>
            : safeDiff.map((line, i) => {
              const l = typeof line === 'string' ? line : ''
              const style = l.startsWith('+') && !l.startsWith('+++')
                ? { background: '#d4edda', color: '#2d6a4f' }
                : l.startsWith('-') && !l.startsWith('---')
                ? { background: '#fde8e6', color: '#c0392b' }
                : l.startsWith('@@')
                ? { background: '#fef3cd', color: '#b7770d' }
                : { color: '#6b5a45' }
              return (
                <div key={i} className="px-3 py-0.5" style={style}>{l || ' '}</div>
              )
            })
          }
        </div>
      )}

      {view === 'before' && (
        <LineBlock lines={safeBefore} borderColor="#a8d5b5" emptyMsg="No snapshot available" />
      )}

      {view === 'after' && (
        <LineBlock lines={safeAfter} color="#c0392b" borderColor="#f5c6c2" emptyMsg="File not found" />
      )}
    </div>
  )
}

// ── Main modal inner ──────────────────────────────────────────────────────────
function FileModalInner({ file, snapshots, onClose }) {
  const [content, setContent]           = useState(null)
  const [diff, setDiff]                 = useState(null)
  const [snapIdx, setSnapIdx]           = useState(0)
  const [loadingContent, setLoadingContent] = useState(true)
  const [loadingDiff, setLoadingDiff]   = useState(false)
  const [contentError, setContentError] = useState(null)

  const isLocked  = Boolean(file?.is_locked)
  const isCanary  = Boolean(file?.is_canary)
  const fileName  = file?.name ?? 'unknown'
  const filePath  = file?.path ?? ''
  const fileSize  = Number(file?.size ?? 0)
  const fileMod   = Number(file?.modified ?? 0)

  const accentColor = isLocked ? '#c0392b' : isCanary ? '#b7770d' : '#C2A68D'
  const accentBg    = isLocked ? '#fde8e6' : isCanary ? '#fef3cd' : '#F5F5DC'

  const [tab, setTab] = useState(isLocked ? 'diff' : 'content')

  useEffect(() => {
    setLoadingContent(true)
    setContentError(null)
    api.fileContent(fileName)
      .then(d => { setContent(d); setLoadingContent(false) })
      .catch(e => { setContentError(String(e)); setLoadingContent(false) })
  }, [fileName])

  const loadDiff = (idx) => {
    const snap = snapshots?.[idx]
    if (!snap) return
    setLoadingDiff(true)
    api.fileDiff(fileName, snap.snapshot_id)
      .then(d => { setDiff(d ?? {}); setLoadingDiff(false) })
      .catch(() => { setDiff({}); setLoadingDiff(false) })
  }

  useEffect(() => {
    if (tab === 'diff') loadDiff(snapIdx)
  }, [tab, snapIdx])

  useEffect(() => {
    if (isLocked && snapshots?.length) loadDiff(0)
  }, [isLocked])

  const snap = snapshots?.[snapIdx]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#FFFFFF',
          border: `1px solid ${accentColor}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.15)`,
          maxHeight: '90vh',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: '#D1BFA2' }}>
          <div className="p-2 rounded-lg shrink-0" style={{ background: accentBg }}>
            {isLocked
              ? <Lock size={16} style={{ color: accentColor }} />
              : <FileText size={16} style={{ color: accentColor }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono font-semibold text-sm truncate" style={{ color: '#1a1a1a' }}>{fileName}</p>
            <p className="text-xs font-mono truncate" style={{ color: '#6b5a45' }}>{filePath}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs" style={{ color: '#6b5a45' }}>
            {isLocked && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full font-bold"
                style={{ color: '#c0392b', background: '#fde8e6', border: '1px solid #f5c6c2' }}>
                <AlertTriangle size={11} /> ENCRYPTED
              </span>
            )}
            <span>{(fileSize / 1024).toFixed(1)} KB</span>
            {fileMod > 0 && (
              <span>{new Date(fileMod * 1000).toLocaleTimeString('en-US', { hour12: false })}</span>
            )}
          </div>
          <button onClick={onClose} className="transition-colors ml-1 shrink-0" style={{ color: '#6b5a45' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b5a45'}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Attack banner ── */}
        {isLocked && (
          <div className="flex items-start gap-3 px-5 py-3 border-b shrink-0"
            style={{ background: '#fde8e6', borderColor: '#f5c6c2' }}>
            <AlertTriangle size={13} style={{ color: '#c0392b' }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: '#c0392b' }}>
              This file was <strong>XOR-encrypted</strong> by the ransomware simulation.
              Switch to <strong>Before / After</strong> to see original vs encrypted content.
              {content?.original_snapshot && (
                <span style={{ color: '#6b5a45' }}> Original recovered from snapshot: </span>
              )}
              {content?.original_snapshot && (
                <span className="font-mono" style={{ color: '#2d6a4f' }}>{content.original_snapshot}</span>
              )}
            </p>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b shrink-0" style={{ borderColor: '#D1BFA2' }}>
          {[
            { id: 'content', Icon: Eye,       label: 'File Content' },
            { id: 'diff',    Icon: GitCompare, label: 'Before / After' },
          ].map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-colors"
              style={tab === id
                ? { borderColor: '#C2A68D', color: '#1a1a1a' }
                : { borderColor: 'transparent', color: '#6b5a45' }
              }
              onMouseEnter={e => { if (tab !== id) e.currentTarget.style.color = '#1a1a1a' }}
              onMouseLeave={e => { if (tab !== id) e.currentTarget.style.color = '#6b5a45' }}
            >
              <Icon size={13} />
              {label}
              {id === 'diff' && isLocked && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c0392b' }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 min-h-0">

          {/* Content tab */}
          {tab === 'content' && (
            <div className="space-y-4">
              {loadingContent && (
                <div className="flex items-center gap-2 text-xs py-8 justify-center" style={{ color: '#6b5a45' }}>
                  <RefreshCw size={14} className="animate-spin" /> Loading file content...
                </div>
              )}
              {contentError && (
                <div className="p-4 rounded-lg text-xs" style={{ background: '#fde8e6', border: '1px solid #f5c6c2', color: '#c0392b' }}>
                  Error: {contentError}
                </div>
              )}
              {!loadingContent && !contentError && content && (
                <>
                  {isLocked ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#2d6a4f' }}>
                          ✓ ORIGINAL (before attack)
                        </p>
                        <pre className="rounded-lg p-4 text-xs font-mono overflow-auto border whitespace-pre-wrap break-all"
                          style={{ background: '#d4edda', borderColor: '#a8d5b5', color: '#3d3020', maxHeight: 300 }}>
                          {content.original_content ?? '— No snapshot found. Take a snapshot before attacking. —'}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#c0392b' }}>
                          ✗ ENCRYPTED (after attack)
                        </p>
                        <pre className="rounded-lg p-4 text-xs font-mono overflow-auto border whitespace-pre-wrap break-all"
                          style={{ background: '#fde8e6', borderColor: '#f5c6c2', color: '#c0392b', maxHeight: 300 }}>
                          {content.current_content ?? '— Could not read encrypted file —'}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#2d6a4f' }}>FILE CONTENT</p>
                      <pre className="rounded-lg p-4 text-xs font-mono overflow-auto border whitespace-pre-wrap break-all"
                        style={{ background: '#F5F5DC', borderColor: '#D1BFA2', color: '#3d3020', maxHeight: 400 }}>
                        {content.current_content ?? '— Empty file —'}
                      </pre>
                    </div>
                  )}
                  {content.truncated && (
                    <p className="text-xs" style={{ color: '#6b5a45' }}>⚠ Truncated at 8 KB</p>
                  )}
                </>
              )}
              {!loadingContent && !contentError && !content && (
                <p className="text-xs text-center py-8" style={{ color: '#6b5a45' }}>
                  Backend offline or file not found
                </p>
              )}
            </div>
          )}

          {/* Before/After tab */}
          {tab === 'diff' && (
            <div>
              {/* Snapshot picker */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
                <span className="text-xs shrink-0" style={{ color: '#6b5a45' }}>Compare with:</span>
                {snapshots?.length > 0 ? (
                  <>
                    <button onClick={() => setSnapIdx(i => Math.max(0, i - 1))}
                      disabled={snapIdx === 0}
                      className="transition-colors disabled:opacity-30 shrink-0" style={{ color: '#6b5a45' }}>
                      <ChevronLeft size={14} />
                    </button>
                    <div className="flex-1 text-center min-w-0">
                      <p className="text-xs font-mono truncate" style={{ color: '#1a1a1a' }}>{snap?.snapshot_id ?? '—'}</p>
                      <p className="text-xs" style={{ color: '#6b5a45' }}>
                        {snap?.created_at ? new Date(snap.created_at).toLocaleString() : ''}
                        {snap?.file_count ? ` · ${snap.file_count} files` : ''}
                      </p>
                    </div>
                    <button onClick={() => setSnapIdx(i => Math.min((snapshots.length - 1), i + 1))}
                      disabled={snapIdx >= snapshots.length - 1}
                      className="transition-colors disabled:opacity-30 shrink-0" style={{ color: '#6b5a45' }}>
                      <ChevronRight size={14} />
                    </button>
                    <span className="text-xs shrink-0" style={{ color: '#6b5a45' }}>{snapIdx + 1}/{snapshots.length}</span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: '#c0392b' }}>
                    No snapshots — click "Snapshot" in Controls first
                  </span>
                )}
              </div>

              {loadingDiff && (
                <div className="flex items-center gap-2 text-xs py-8 justify-center" style={{ color: '#6b5a45' }}>
                  <RefreshCw size={14} className="animate-spin" /> Loading comparison...
                </div>
              )}

              {!loadingDiff && diff && (
                <DiffView
                  diff={diff.diff ?? []}
                  beforeLines={diff.before_lines ?? []}
                  afterLines={diff.after_lines ?? []}
                  beforeSize={diff.before_size ?? 0}
                  afterSize={diff.after_size ?? 0}
                  isLocked={isLocked}
                />
              )}

              {!loadingDiff && !diff && snapshots?.length > 0 && (
                <p className="text-xs text-center py-8" style={{ color: '#6b5a45' }}>
                  Click a snapshot above to load comparison
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Exported wrapper with error boundary ──────────────────────────────────────
export default function FileModal(props) {
  return (
    <ModalErrorBoundary onClose={props.onClose}>
      <FileModalInner {...props} />
    </ModalErrorBoundary>
  )
}
