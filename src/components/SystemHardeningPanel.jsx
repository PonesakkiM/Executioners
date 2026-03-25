import { useEffect, useState } from 'react'
import { CheckCircle, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'

const Row = ({ label, value, ok = true }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
    <span className="text-[#8b949e] text-sm">{label}</span>
    <span className={`text-sm font-medium flex items-center gap-1 ${ok ? 'text-[#00ff88]' : 'text-[#f85149]'}`}>
      <CheckCircle size={12} /> {value}
    </span>
  </div>
)

export default function SystemHardeningPanel() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.hardening().then(setData)
  }, [])

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
      <p className="text-xs font-semibold tracking-widest text-[#8b949e] uppercase mb-4">
        Technical Hardening Status
      </p>
      {data ? (
        <div>
          <Row label="Last OS Update Check" value={new Date(data.last_os_update_check).toLocaleString()} />
          <Row label="Antivirus Status"      value={data.antivirus_status} />
          <Row label="Email Filtering"       value={data.email_filtering} />
          <Row label="Firewall"              value={data.firewall} />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[#8b949e] text-sm">
          <RefreshCw size={14} className="animate-spin" /> Connecting to backend...
        </div>
      )}
    </div>
  )
}
