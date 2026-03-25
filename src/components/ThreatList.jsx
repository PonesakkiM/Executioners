import { XCircle, AlertTriangle, Ban } from 'lucide-react'

const threats = [
  { file: 'payroll_q1.xlsx', severity: 'CRITICAL', time: '11:58:32', action: 'Quarantined', color: 'bg-[#3d1a1a] border-[#6e1a1a]' },
  { file: 'customer_db.sql', severity: 'CRITICAL', time: '11:57:14', action: 'Blocked', color: 'bg-[#3d1a1a] border-[#6e1a1a]' },
  { file: 'backup_manifest.json', severity: 'HIGH', time: '11:55:01', action: 'Prevented', color: 'bg-[#2d2200] border-[#5a4400]' },
  { file: 'svchost_mod.dll', severity: 'HIGH', time: '11:52:48', action: 'Terminated', color: 'bg-[#2d2200] border-[#5a4400]' },
  { file: 'network_scan.ps1', severity: 'MEDIUM', time: '11:49:33', action: 'Blocked', color: 'bg-[#0d1f2d] border-[#1a3a52]' },
  { file: 'README_DECRYPT.txt', severity: 'MEDIUM', time: '11:45:12', action: 'Deleted', color: 'bg-[#0d1f2d] border-[#1a3a52]' },
]

const severityColors = {
  CRITICAL: 'text-[#f85149]',
  HIGH: 'text-[#d29922]',
  MEDIUM: 'text-[#388bfd]',
}

const SeverityIcon = ({ severity }) => {
  if (severity === 'CRITICAL') return <XCircle size={16} className="text-[#f85149]" />
  if (severity === 'HIGH') return <AlertTriangle size={16} className="text-[#d29922]" />
  return <Ban size={16} className="text-[#388bfd]" />
}

export default function ThreatList() {
  return (
    <div className="space-y-2">
      {threats.map((t, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 py-3 rounded-lg border ${t.color} cursor-pointer hover:brightness-110 transition-all`}
        >
          <div className="flex items-center gap-3">
            <SeverityIcon severity={t.severity} />
            <div>
              <span className="text-white text-sm font-medium">{t.file}</span>
              <span className={`ml-2 text-xs font-bold ${severityColors[t.severity]}`}>{t.severity}</span>
              <p className="text-[#8b949e] text-xs">{t.time} · {t.action}</p>
            </div>
          </div>
          <span className="text-[#484f58] text-lg">›</span>
        </div>
      ))}
    </div>
  )
}
