import { Cpu, FileText, Network, HardDrive } from 'lucide-react'

function MetricCard({ icon: Icon, label, value, color = 'text-white' }) {
  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4 flex items-center gap-3">
      <div className="p-2 bg-[#161b22] rounded-lg">
        <Icon size={16} className="text-[#8b949e]" />
      </div>
      <div>
        <p className="text-[#8b949e] text-xs">{label}</p>
        <p className={`font-bold text-lg ${color}`}>{value}</p>
      </div>
    </div>
  )
}

function CpuBar({ value }) {
  return (
    <div className="w-full bg-[#21262d] rounded-full h-1.5 mt-1">
      <div
        className="bg-[#388bfd] h-1.5 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default function SystemMetrics() {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
      <h2 className="text-xs font-semibold tracking-widest text-[#8b949e] uppercase mb-4">
        System Metrics
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={Cpu} label="CPU USAGE" value="37%" color="text-white" />
        <MetricCard icon={FileText} label="MONITORED FILES" value="284,719" color="text-white" />
        <MetricCard icon={Network} label="NETWORK I/O" value="1.2 GB/s" color="text-[#00ff88]" />
        <MetricCard icon={HardDrive} label="DISK USAGE" value="68%" color="text-[#d29922]" />
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-[#8b949e] mb-1">
            <span>CPU</span><span>37%</span>
          </div>
          <CpuBar value={37} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#8b949e] mb-1">
            <span>Memory</span><span>54%</span>
          </div>
          <div className="w-full bg-[#21262d] rounded-full h-1.5">
            <div className="bg-[#00ff88] h-1.5 rounded-full" style={{ width: '54%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#8b949e] mb-1">
            <span>Disk</span><span>68%</span>
          </div>
          <div className="w-full bg-[#21262d] rounded-full h-1.5">
            <div className="bg-[#d29922] h-1.5 rounded-full" style={{ width: '68%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
