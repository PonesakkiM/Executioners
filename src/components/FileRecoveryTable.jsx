import { CheckCircle, Lock, RotateCcw } from 'lucide-react'

const files = [
  { name: 'payroll_q1.xlsx', path: '/finance/reports/', size: '2.4 MB', status: 'Restored' },
  { name: 'employee_data.csv', path: '/hr/exports/', size: '890 KB', status: 'Restored' },
  { name: 'q4_budget.xlsx', path: '/finance/planning/', size: '1.1 MB', status: 'Restored' },
  { name: 'contracts_2025.pdf', path: '/legal/docs/', size: '3.7 MB', status: 'Encrypted' },
]

const StatusBadge = ({ status }) => {
  if (status === 'Restored') {
    return (
      <span className="flex items-center gap-1 text-xs text-[#00ff88] bg-[#00ff8815] border border-[#00ff8830] px-2 py-0.5 rounded-full">
        <CheckCircle size={11} /> Restored
      </span>
    )
  }
  if (status === 'Encrypted') {
    return (
      <span className="flex items-center gap-1 text-xs text-[#f85149] bg-[#f8514915] border border-[#f8514930] px-2 py-0.5 rounded-full">
        <Lock size={11} /> Encrypted
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-[#d29922] bg-[#d2992215] border border-[#d2992230] px-2 py-0.5 rounded-full">
      <RotateCcw size={11} /> Recovering
    </span>
  )
}

export default function FileRecoveryTable() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[#484f58] text-xs uppercase tracking-wider border-b border-[#21262d]">
          <th className="text-left pb-2 font-medium">File</th>
          <th className="text-left pb-2 font-medium">Path</th>
          <th className="text-left pb-2 font-medium">Size</th>
          <th className="text-left pb-2 font-medium">Status</th>
          <th className="text-left pb-2 font-medium">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#21262d]">
        {files.map((f, i) => (
          <tr key={i} className="hover:bg-[#1c2128] transition-colors">
            <td className="py-3 text-white font-medium">{f.name}</td>
            <td className="py-3 text-[#8b949e]">{f.path}</td>
            <td className="py-3 text-[#8b949e]">{f.size}</td>
            <td className="py-3"><StatusBadge status={f.status} /></td>
            <td className="py-3">
              <button className="text-xs text-[#388bfd] hover:underline">
                {f.status === 'Encrypted' ? 'Decrypt' : 'View'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
