import { MousePointerClick, KeyRound, AlertCircle, Mail, Lock, Users } from 'lucide-react'

const tips = [
  { icon: MousePointerClick, text: 'Hover before clicking links — verify the destination URL', level: 'tip' },
  { icon: KeyRound,          text: 'Enable Multi-Factor Authentication on all critical accounts', level: 'important' },
  { icon: AlertCircle,       text: 'Avoid urgency-based phishing emails — attackers create false pressure', level: 'warning' },
  { icon: Mail,              text: 'Never open unexpected attachments, even from known senders', level: 'warning' },
  { icon: Lock,              text: 'Use strong, unique passwords and a password manager', level: 'tip' },
]

const levelStyle = {
  tip:       { color: '#2F80ED', bg: 'rgba(47,128,237,0.06)',  border: 'rgba(47,128,237,0.15)' },
  important: { color: '#00FFB2', bg: 'rgba(0,255,178,0.06)',   border: 'rgba(0,255,178,0.15)'  },
  warning:   { color: '#F2C94C', bg: 'rgba(242,201,76,0.06)',  border: 'rgba(242,201,76,0.15)' },
}

export default function HumanDefensePanel() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-[#2F80ED]" />
        <p className="text-xs font-semibold tracking-widest text-[#4a6080] uppercase">Human Defense Layer</p>
      </div>
      <div className="space-y-2">
        {tips.map((t, i) => {
          const s = levelStyle[t.level]
          return (
            <div
              key={i}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all hover:scale-[1.01]"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <t.icon size={15} style={{ color: s.color }} className="mt-0.5 shrink-0" />
              <p className="text-sm text-[#8ba0b8] leading-relaxed">{t.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
