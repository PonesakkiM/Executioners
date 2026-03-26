import { useState } from 'react'
import { api } from '../lib/api'
import { Zap, ShieldOff, RotateCcw, RefreshCw, Play, Info } from 'lucide-react'
import AttackDetailPanel from './AttackDetailPanel'

export default function AttackControlPanel({ onRefresh, systemStatus }) {
  const [loading, setLoading]       = useState(null)
  const [log, setLog]               = useState([])
  const [showDetail, setShowDetail] = useState(false)

  const addLog = (msg, type = 'ok') => setLog(prev => [{ msg, type, t: new Date().toLocaleTimeString() }, ...prev].slice(0, 6))

  const run = async (id, label, fn, successMsg) => {
    setLoading(id)
    addLog(`${label}...`, 'warn')
    const res = await fn()
    if (res) addLog(successMsg ?? `${label} complete`, 'ok')
    else     addLog(`${label} failed — backend offline?`, 'err')
    setLoading(null)
    onRefresh?.()
  }

  const handleAttack   = () => run('attack',   'Simulating attack',  api.simulateAttack, 'Attack started — watch threat score rise')
  const handleContain  = () => run('contain',  'Containing threat',  api.contain,        'Threat contained — score reset')
  const handleSnapshot = () => run('snapshot', 'Taking snapshot',    api.takeSnapshot,   'Snapshot created — files backed up')

  const isUnderAttack = systemStatus === 'critical' || systemStatus === 'warning'

  const logColor = { ok: '#2d6a4f', warn: '#b7770d', err: '#c0392b' }

  return (
    <>
      <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
        <div className="flex items-center gap-2 mb-4">
          <Play size={14} style={{ color: '#b7770d' }} />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Controls</p>
          {isUnderAttack && (
            <button
              onClick={() => setShowDetail(true)}
              className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors animate-pulse"
              style={{ color: '#c0392b', border: '1px solid #c0392b', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fde8e6'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Info size={11} /> Attack Details
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 mb-3">
          {/* Simulate Attack */}
          <button
            onClick={handleAttack}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] disabled:opacity-40 disabled:scale-100"
            style={{ color: '#c0392b', background: '#fde8e6', border: '1px solid #c0392b' }}
          >
            {loading === 'attack' ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            Simulate Attack
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Contain */}
            <button
              onClick={handleContain}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] disabled:opacity-40"
              style={{ color: '#b7770d', background: '#fef3cd', border: '1px solid #b7770d' }}
            >
              {loading === 'contain' ? <RefreshCw size={14} className="animate-spin" /> : <ShieldOff size={14} />}
              Contain
            </button>

            {/* Snapshot */}
            <button
              onClick={handleSnapshot}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] disabled:opacity-40"
              style={{ color: '#2d6a4f', background: '#d4edda', border: '1px solid #2d6a4f' }}
            >
              {loading === 'snapshot' ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Snapshot
            </button>
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="rounded-lg p-3 font-mono text-xs space-y-1" style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
            {log.map((l, i) => (
              <p key={i} style={{ color: i === 0 ? logColor[l.type] : '#6b5a45' }}>
                <span style={{ color: '#C2A68D' }}>{l.t} </span>{l.msg}
              </p>
            ))}
          </div>
        )}
      </div>

      <AttackDetailPanel visible={showDetail} onClose={() => setShowDetail(false)} />
    </>
  )
}
