import { useState } from 'react'
import { api } from '../lib/api'
import { Search, AlertTriangle, CheckCircle, ShieldAlert, RefreshCw, X, Globe, Link } from 'lucide-react'

const DEMO_URLS = [
  { label: 'Phishing (Microsoft)', url: 'http://microsoft-account-verify.top/login' },
  { label: 'Typosquatting',        url: 'https://paypa1.com/secure/login' },
  { label: 'Brand impersonation',  url: 'https://google-security-alert.xyz/verify' },
  { label: 'Legitimate',           url: 'https://microsoft.com' },
  { label: 'IP address attack',    url: 'http://192.168.1.105/login/verify' },
]

const verdictStyle = {
  MALICIOUS:  { color: '#c0392b', bg: 'rgba(192,57,43,0.08)',  border: 'rgba(192,57,43,0.3)',  icon: ShieldAlert, label: '🚨 MALICIOUS — DO NOT CLICK' },
  SUSPICIOUS: { color: '#b7770d', bg: 'rgba(183,119,13,0.08)', border: 'rgba(183,119,13,0.3)', icon: AlertTriangle, label: '⚠ SUSPICIOUS — Proceed with caution' },
  SAFE:       { color: '#2d6a4f', bg: 'rgba(45,106,79,0.08)',  border: 'rgba(45,106,79,0.3)',  icon: CheckCircle, label: '✓ SAFE — No threats detected' },
  INVALID:    { color: '#6b5a45', bg: 'rgba(107,90,69,0.08)',  border: 'rgba(107,90,69,0.2)',  icon: X, label: 'Invalid URL' },
}

export default function URLScanner({ user }) {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState(null)
  const [scanning, setScanning] = useState(false)
  const [history, setHistory] = useState([])

  const scan = async (urlToScan) => {
    const target = (urlToScan ?? url).trim()
    if (!target) return
    setScanning(true)
    setResult(null)
    const r = await api.scanUrl(target, user?.name ?? 'user')
    setResult(r)
    if (r) setHistory(prev => [{ url: target, ...r, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10))
    setScanning(false)
  }

  const style = result ? (verdictStyle[result.verdict] ?? verdictStyle.INVALID) : null

  return (
    <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #D1BFA2' }}>
      <div className="flex items-center gap-2 mb-4">
        <Link size={14} style={{ color: '#6b5a45' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>
          URL Threat Scanner
        </p>
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
          style={{ color: '#2d6a4f', background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.2)' }}>
          Human Layer Protection
        </span>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#BFAF8D' }} />
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setResult(null) }}
            onKeyDown={e => e.key === 'Enter' && scan()}
            placeholder="Paste a suspicious URL here to check if it's safe..."
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-colors"
            style={{
              background: '#F5F5DC',
              border: '1px solid #D1BFA2',
              color: '#1a1a1a',
            }}
          />
        </div>
        <button
          onClick={() => scan()}
          disabled={scanning || !url.trim()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: '#C2A68D', color: '#1a1a1a', border: '1px solid #BFAF8D' }}
        >
          {scanning ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {scanning ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {/* Result */}
      {result && style && (
        <div className="rounded-xl p-4 mb-4 transition-all"
          style={{ background: style.bg, border: `2px solid ${style.border}` }}>

          {/* Verdict banner */}
          <div className="flex items-center gap-3 mb-3">
            <style.icon size={20} style={{ color: style.color }} />
            <p className="font-bold text-base" style={{ color: style.color }}>{style.label}</p>
            <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full"
              style={{ color: style.color, background: `${style.color}15`, border: `1px solid ${style.color}30` }}>
              Risk: {result.risk_score}/100
            </span>
          </div>

          {/* Domain */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #D1BFA2' }}>
            <Globe size={13} style={{ color: '#6b5a45' }} />
            <span className="text-xs font-mono" style={{ color: '#1a1a1a' }}>{result.domain}</span>
          </div>

          {/* Risk score bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: '#6b5a45' }}>
              <span>Risk Score</span><span>{result.risk_score}/100</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#D1BFA2' }}>
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${result.risk_score}%`, background: style.color }} />
            </div>
          </div>

          {/* Reasons */}
          {result.reasons?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: '#6b5a45' }}>Why flagged:</p>
              {result.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.5)', borderLeft: `3px solid ${style.color}` }}>
                  <span className="text-xs" style={{ color: '#3d3020' }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Flags */}
          {result.flags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {result.flags.map((f, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                  style={{ color: style.color, background: `${style.color}12`, border: `1px solid ${style.color}25` }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          {result.verdict === 'MALICIOUS' && (
            <div className="mt-3 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)' }}>
              <p className="text-xs font-semibold" style={{ color: '#c0392b' }}>
                🚨 Admin has been notified via email. Do not click this link.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scan history */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b5a45' }}>
            Recent Scans
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((h, i) => {
              const s = verdictStyle[h.verdict] ?? verdictStyle.INVALID
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: '#F5F5DC', border: '1px solid #D1BFA2' }}>
                  <s.icon size={12} style={{ color: s.color }} className="shrink-0" />
                  <span className="text-xs font-mono flex-1 truncate" style={{ color: '#1a1a1a' }}>{h.url}</span>
                  <span className="text-xs font-bold shrink-0" style={{ color: s.color }}>{h.verdict}</span>
                  <span className="text-xs shrink-0" style={{ color: '#BFAF8D' }}>{h.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
