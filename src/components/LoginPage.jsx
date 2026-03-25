import { useState } from 'react'
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle, Loader } from 'lucide-react'
import { api } from '../lib/api'

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Timeout after 8 seconds so it never spins forever
    const timeout = new Promise(r => setTimeout(() => r(null), 8000))
    const res = await Promise.race([
      api.login(email.trim().toLowerCase(), password),
      timeout
    ])

    if (res === null) {
      setError('Cannot connect to server. Make sure the backend is running.')
    } else if (res?.success && res.user) {
      await api.setSession(res.user)
      onLogin(res.user)
    } else {
      // Wrong credentials — error already shown, email sent by backend
      setError(res?.error ?? 'Invalid email or password.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050d1a]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.06]"
          style={{ background: '#00FFB2' }} />
      </div>

      <div className="relative w-full max-w-sm mx-auto px-6 flex flex-col items-center">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 rounded-2xl mb-4"
            style={{ background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.2)' }}>
            <Shield size={32} className="text-[#00FFB2]" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">SentinelShield AI</h1>
          <p className="text-[#4a6080] text-sm mt-1">Ransomware Defense Platform</p>
        </div>

        {/* Form card */}
        <div className="w-full rounded-2xl p-8" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
          <h2 className="text-white font-semibold text-base mb-1 text-center">Welcome back</h2>
          <p className="text-[#4a6080] text-xs text-center mb-6">Sign in with your company credentials</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2a3d55] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="company@sentinelshield.ai"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-[#2a3d55] bg-[#050d1a] border border-[#1a2d4a] focus:outline-none focus:border-[#2F80ED] transition-colors"
              />
            </div>

            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2a3d55] pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-[#2a3d55] bg-[#050d1a] border border-[#1a2d4a] focus:outline-none focus:border-[#2F80ED] transition-colors"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2a3d55] hover:text-[#4a6080] transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#FF3B3B]"
                style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)' }}>
                <AlertTriangle size={12} className="shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ background: 'rgba(0,255,178,0.12)', border: '1px solid rgba(0,255,178,0.35)', color: '#00FFB2' }}
            >
              {loading
                ? <><Loader size={14} className="animate-spin" /> Authenticating...</>
                : <><Shield size={14} /> Sign In</>
              }
            </button>
          </form>
        </div>

        <p className="text-[#2a3d55] text-xs mt-6">© 2026 SentinelShield Technologies · v2.4.1-beta</p>
      </div>
    </div>
  )
}
