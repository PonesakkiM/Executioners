import { useState } from 'react'
import { api } from '../lib/api'
import { Zap, ShieldOff, RotateCcw, RefreshCw, Play, Info } from 'lucide-react'
import AttackDetailPanel from './AttackDetailPanel'

export default function AttackControlPanel({ onRefresh, systemStatus }) {
  const [loading, setLoading]       = useState(null)
  const [log, setLog]               = useState([])
  const [showDetail, setShowDetail] = useState(false)

  const addLog = (msg, color = '#00FFB2') => setLog(prev => [{ msg, color, t: new Date().toLocaleTimeString() }, ...prev].slice(0, 6))

  const run = async (id, label, fn, successMsg) => {
    setLoading(id)
    addLog(`${label}...`, '#F2C94C')
    const res = await fn()
    if (res) addLog(successMsg ?? `${label} complete`, '#00FFB2')
    else     addLog(`${label} failed — backend offline?`, '#FF3B3B')
    setLoading(null)
    onRefresh?.()
  }

  const handleAttack = () => run('attack', 'Simulating attack', api.simulateAttack,
    'Attack started — watch threat score rise')

  const handleContain = () => run('contain', 'Containing threat', api.contain,
    'Threat contained — score reset')

  const handleSnapshot = () => run('snapshot', 'Taking snapshot', api.takeSnapshot,
    'Snapshot created — files backed up')

  const isUnderAttack = systemStatus === 'critical' || systemStatus === 'warning'

  return (
    <>
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Play size={14} className="text-[#F2C94C]" />
          <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Controls</p>
          {isUnderAttack && (
            <button
              onClick={() => setShowDetail(true)}
              className="ml-auto flex items-center gap-1 text-xs text-[#FF3B3B] border border-[#FF3B3B]/30 px-2 py-1 rounded-lg hover:bg-[#FF3B3B]/10 transition-colors animate-pulse"
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
            style={{ color: '#FF3B3B', background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.25)' }}
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
              style={{ color: '#F2C94C', background: 'rgba(242,201,76,0.08)', border: '1px solid rgba(242,201,76,0.25)' }}
            >
              {loading === 'contain' ? <RefreshCw size={14} className="animate-spin" /> : <ShieldOff size={14} />}
              Contain
            </button>

            {/* Snapshot */}
            <button
              onClick={handleSnapshot}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] disabled:opacity-40"
              style={{ color: '#00FFB2', background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.25)' }}
            >
              {loading === 'snapshot' ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Snapshot
            </button>
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-[#050d1a] rounded-lg p-3 font-mono text-xs space-y-1 border border-[#1a2d4a]">
            {log.map((l, i) => (
              <p key={i} style={{ color: i === 0 ? l.color : '#2a3d55' }}>
                <span className="text-[#1a2d4a]">{l.t} </span>{l.msg}
              </p>
            ))}
          </div>
        )}
      </div>

      <AttackDetailPanel visible={showDetail} onClose={() => setShowDetail(false)} />
    </>
  )
}
