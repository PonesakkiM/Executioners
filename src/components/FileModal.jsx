import { useEffect, useState, Component } from 'react'
import { api } from '../lib/api'
import {
  X, FileText, Lock, AlertTriangle, ChevronLeft, ChevronRight,
  Eye, GitCompare, ShieldCheck, ShieldAlert, RefreshCw
} from 'lucide-react'

// ── Error boundary so a crash never blacks out the whole page ─────────────────
class ModalErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <AlertTriangle size={32} className="text-[#FF3B3B] mx-auto" />
          <p className="text-white font-semibold">Failed to render file viewer</p>
          <p className="text-[#4a6080] text-xs font-mono">{this.state.error?.message}</p>
          <button onClick={this.props.onClose}
            className="px-4 py-2 bg-[#2F80ED]/20 border border-[#2F80ED]/30 text-[#2F80ED] rounded-lg text-sm hover:bg-[#2F80ED]/30 transition-colors">
            Close
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}

// ── Safe line renderer ────────────────────────────────────────────────────────
function LineBlock({ lines = [], compareLines = [], color = '#8ba0b8', borderColor = '#1a2d4a', emptyMsg = 'No content' }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-lg border font-mono text-xs"
        style={{ borderColor, background: '#050d1a' }}>
        <p className="text-[#2a3d55]">{emptyMsg}</p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border overflow-auto font-mono text-xs" style={{ borderColor, background: '#050d1a', maxHeight: 260 }}>
      {lines.map((l, i) => {
        const raw = typeof l === 'string' ? l.replace(/\n$/, '') : String(l ?? '')
        const changed = compareLines.length > 0 && raw !== (typeof compareLines[i] === 'string' ? compareLines[i].replace(/\n$/, '') : '')
        return (
          <div key={i} className="flex px-3 py-0.5 hover:bg-white/[0.02]"
            style={{ background: changed ? `${color}08` : undefined }}>
            <span className="text-[#1a2d4a] w-8 shrink-0 select-none text-right mr-3">{i + 1}</span>
            <span style={{ color: changed ? color : '#8ba0b8' }}>{raw}</span>
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
      <div className="flex rounded-lg overflow-hidden border border-[#1a2d4a] mb-4 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === t.id ? 'bg-[#2F80ED] text-white' : 'text-[#4a6080] hover:text-white bg-[#0a1628]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {view === 'split' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={13} className="text-[#00FFB2]" />
              <span className="text-xs font-semibold text-[#00FFB2]">BEFORE ATTACK</span>
            </div>
            <LineBlock lines={safeBefore} borderColor="rgba(0,255,178,0.2)"
              emptyMsg="No snapshot — take one before attacking" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={13} className="text-[#FF3B3B]" />
              <span className="text-xs font-semibold text-[#FF3B3B]">
                AFTER ATTACK {isLocked ? '(Encrypted)' : '(Modified)'}
              </span>
            </div>
            <LineBlock lines={safeAfter} compareLines={safeBefore}
              color="#FF3B3B" borderColor="rgba(255,59,59,0.2)"
              emptyMsg="File not in sandbox (quarantined?)" />
          </div>
        </div>
      )}

      {view === 'diff' && (
        <div className="bg-[#050d1a] rounded-lg border border-[#1a2d4a] overflow-auto font-mono text-xs" style={{ maxHeight: 320 }}>
          {safeDiff.length === 0
            ? <p className="p-4 text-[#4a6080]">No diff — files may be identical or no snapshot available</p>
            : safeDiff.map((line, i) => {
              const l = typeof line === 'string' ? line : ''
              return (
                <div key={i} className={`px-3 py-0.5 ${
                  l.startsWith('+') && !l.startsWith('+++') ? 'bg-[#00FFB2]/08 text-[#00FFB2]' :
                  l.startsWith('-') && !l.startsWith('---') ? 'bg-[#FF3B3B]/08 text-[#FF3B3B]' :
                  l.startsWith('@@') ? 'text-[#2F80ED] bg-[#2F80ED]/08' : 'text-[#4a6080]'
                }`}>{l || ' '}</div>
              )
            })
          }
        </div>
      )}

      {view === 'before' && (
        <LineBlock lines={safeBefore} borderColor="rgba(0,255,178,0.15)" emptyMsg="No snapshot available" />
      )}

      {view === 'after' && (
        <LineBlock lines={safeAfter} color="#FF3B3B" borderColor="rgba(255,59,59,0.15)" emptyMsg="File not found" />
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

  // Safe file props with defaults
  const isLocked = Boolean(file?.is_locked)
  const isCanary = Boolean(file?.is_canary)
  const fileName = file?.name ?? 'unknown'
  const filePath = file?.path ?? ''
  const fileSize = Number(file?.size ?? 0)
  const fileMod  = Number(file?.modified ?? 0)
  const fileStatus = file?.status ?? 'normal'

  const accentColor = isLocked ? '#FF3B3B' : isCanary ? '#F2C94C' : '#2F80ED'

  const [tab, setTab] = useState(isLocked ? 'diff' : 'content')

  // Load file content
  useEffect(() => {
    setLoadingContent(true)
    setContentError(null)
    api.fileContent(fileName)
      .then(d => { setContent(d); setLoadingContent(false) })
      .catch(e => { setContentError(String(e)); setLoadingContent(false) })
  }, [fileName])

  // Load diff
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

  // Auto-load diff for locked files
  useEffect(() => {
    if (isLocked && snapshots?.length) loadDiff(0)
  }, [isLocked])

  const snap = snapshots?.[snapIdx]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#0a1628',
          border: `1px solid ${accentColor}25`,
          boxShadow: `0 0 50px ${accentColor}12, 0 20px 60px rgba(0,0,0,0.9)`,
          maxHeight: '90vh',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a2d4a] shrink-0">
          <div className="p-2 rounded-lg shrink-0" style={{ background: `${accentColor}15` }}>
            {isLocked
              ? <Lock size={16} style={{ color: accentColor }} />
              : <FileText size={16} style={{ color: accentColor }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-mono font-semibold text-sm truncate">{fileName}</p>
            <p className="text-[#4a6080] text-xs font-mono truncate">{filePath}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-[#4a6080]">
            {isLocked && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full font-bold"
                style={{ color: '#FF3B3B', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)' }}>
                <AlertTriangle size={11} /> ENCRYPTED
              </span>
            )}
            <span>{(fileSize / 1024).toFixed(1)} KB</span>
            {fileMod > 0 && (
              <span>{new Date(fileMod * 1000).toLocaleTimeString('en-US', { hour12: false })}</span>
            )}
          </div>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white transition-colors ml-1 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* ── Attack banner ── */}
        {isLocked && (
          <div className="flex items-start gap-3 px-5 py-3 border-b border-[#1a2d4a] shrink-0"
            style={{ background: 'rgba(255,59,59,0.05)' }}>
            <AlertTriangle size={13} className="text-[#FF3B3B] shrink-0 mt-0.5" />
            <p className="text-xs text-[#FF3B3B] leading-relaxed">
              This file was <strong>XOR-encrypted</strong> by the ransomware simulation.
              Switch to <strong>Before / After</strong> to see original vs encrypted content.
              {content?.original_snapshot && (
                <span className="text-[#4a6080]"> Original recovered from snapshot: </span>
              )}
              {content?.original_snapshot && (
                <span className="text-[#00FFB2] font-mono">{content.original_snapshot}</span>
              )}
            </p>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b border-[#1a2d4a] shrink-0">
          {[
            { id: 'content', Icon: Eye,       label: 'File Content' },
            { id: 'diff',    Icon: GitCompare, label: 'Before / After' },
          ].map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-[#2F80ED] text-[#2F80ED]'
                  : 'border-transparent text-[#4a6080] hover:text-white'
              }`}>
              <Icon size={13} />
              {label}
              {id === 'diff' && isLocked && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#FF3B3B] animate-pulse" />
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
                <div className="flex items-center gap-2 text-[#4a6080] text-xs py-8 justify-center">
                  <RefreshCw size={14} className="animate-spin" /> Loading file content...
                </div>
              )}
              {contentError && (
                <div className="p-4 rounded-lg bg-[#FF3B3B]/08 border border-[#FF3B3B]/20 text-xs text-[#FF3B3B]">
                  Error: {contentError}
                </div>
              )}
              {!loadingContent && !contentError && content && (
                <>
                  {/* Locked: show original + encrypted side by side */}
                  {isLocked ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#00FFB2] mb-2">
                          ✓ ORIGINAL (before attack)
                        </p>
                        <pre className="rounded-lg p-4 text-xs font-mono overflow-auto border whitespace-pre-wrap break-all"
                          style={{ background: 'rgba(0,255,178,0.03)', borderColor: 'rgba(0,255,178,0.15)', color: '#8ba0b8', maxHeight: 300 }}>
                          {content.original_content ?? '— No snapshot found. Take a snapshot before attacking. —'}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#FF3B3B] mb-2">
                          ✗ ENCRYPTED (after attack)
                        </p>
                        <pre className="rounded-lg p-4 text-xs font-mono overflow-auto border whitespace-pre-wrap break-all"
                          style={{ background: 'rgba(255,59,59,0.04)', borderColor: 'rgba(255,59,59,0.2)', color: '#ff8080', maxHeight: 300 }}>
                          {content.current_content ?? '— Could not read encrypted file —'}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-[#00FFB2] mb-2">FILE CONTENT</p>
                      <pre className="rounded-lg p-4 text-xs font-mono overflow-auto border whitespace-pre-wrap break-all"
                        style={{ background: 'rgba(0,255,178,0.03)', borderColor: 'rgba(0,255,178,0.1)', color: '#8ba0b8', maxHeight: 400 }}>
                        {content.current_content ?? '— Empty file —'}
                      </pre>
                    </div>
                  )}
                  {content.truncated && (
                    <p className="text-[#4a6080] text-xs">⚠ Truncated at 8 KB</p>
                  )}
                </>
              )}
              {!loadingContent && !contentError && !content && (
                <p className="text-[#4a6080] text-xs text-center py-8">
                  Backend offline or file not found
                </p>
              )}
            </div>
          )}

          {/* Before/After tab */}
          {tab === 'diff' && (
            <div>
              {/* Snapshot picker */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-[#050d1a] rounded-lg border border-[#1a2d4a]">
                <span className="text-xs text-[#4a6080] shrink-0">Compare with:</span>
                {snapshots?.length > 0 ? (
                  <>
                    <button onClick={() => setSnapIdx(i => Math.max(0, i - 1))}
                      disabled={snapIdx === 0}
                      className="text-[#4a6080] hover:text-white disabled:opacity-30 shrink-0">
                      <ChevronLeft size={14} />
                    </button>
                    <div className="flex-1 text-center min-w-0">
                      <p className="text-white text-xs font-mono truncate">{snap?.snapshot_id ?? '—'}</p>
                      <p className="text-[#4a6080] text-xs">
                        {snap?.created_at ? new Date(snap.created_at).toLocaleString() : ''}
                        {snap?.file_count ? ` · ${snap.file_count} files` : ''}
                      </p>
                    </div>
                    <button onClick={() => setSnapIdx(i => Math.min((snapshots.length - 1), i + 1))}
                      disabled={snapIdx >= snapshots.length - 1}
                      className="text-[#4a6080] hover:text-white disabled:opacity-30 shrink-0">
                      <ChevronRight size={14} />
                    </button>
                    <span className="text-[#2a3d55] text-xs shrink-0">{snapIdx + 1}/{snapshots.length}</span>
                  </>
                ) : (
                  <span className="text-[#FF3B3B] text-xs">
                    No snapshots — click "Snapshot" in Controls first
                  </span>
                )}
              </div>

              {loadingDiff && (
                <div className="flex items-center gap-2 text-[#4a6080] text-xs py-8 justify-center">
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
                <p className="text-[#4a6080] text-xs text-center py-8">
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
