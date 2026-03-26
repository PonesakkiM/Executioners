import { MousePointerClick, KeyRound, AlertCircle, Mail, Lock, Users } from 'lucide-react'

const tips = [
  { icon: MousePointerClick, text: 'Hover before clicking links — verify the destination URL', level: 'tip' },
  { icon: KeyRound,          text: 'Enable Multi-Factor Authentication on all critical accounts', level: 'important' },
  { icon: AlertCircle,       text: 'Avoid urgency-based phishing emails — attackers create false pressure', level: 'warning' },
  { icon: Mail,              text: 'Never open unexpected attachments, even from known senders', level: 'warning' },
  { icon: Lock,              text: 'Use strong, unique passwords and a password manager', level: 'tip' },
]

const levelStyle = {
  tip:       { color: '#C2A68D', bg: '#F5F5DC',  border: '#D1BFA2' },
  important: { color: '#2d6a4f', bg: '#d4edda',  border: '#a8d5b5' },
  warning:   { color: '#b7770d', bg: '#fef3cd',  border: '#fde68a' },
}

export default function HumanDefensePanel() {
  return (
    <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #D1BFA2' }}>
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} style={{ color: '#C2A68D' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b5a45' }}>Human Defense Layer</p>
      </div>
      <div className="space-y-2">
        {tips.map((t, i) => {
          const s = levelStyle[t.level]
          return (
            <div
              key={i}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all hover:scale-[1.01]"
              style={{ background: s.bg, border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.color}` }}
            >
              <t.icon size={15} style={{ color: s.color }} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed" style={{ color: '#3d3020' }}>{t.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
