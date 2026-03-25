import { useState, useEffect } from 'react'
import { api } from '../lib/api'

import SystemStatusCard     from './SystemStatusCard'
import ThreatScoreGauge     from './ThreatScoreGauge'
import LiveActivityFeed     from './LiveActivityFeed'
import CanaryAlertPanel     from './CanaryAlertPanel'
import EntropyGraph         from './EntropyGraph'
import BackupSnapshotPanel  from './BackupSnapshotPanel'
import QuarantineViewer     from './QuarantineViewer'
import MonitoredPathsPanel  from './MonitoredPathsPanel'
import MonitoredFilesPanel  from './MonitoredFilesPanel'
import HumanDefensePanel    from './HumanDefensePanel'
import AttackControlPanel   from './AttackControlPanel'

export default function Dashboard({ onStatusChange }) {
  const [sys, setSys] = useState({ status: 'secure', threat_score: 0, canary_hit: false, canary_intact: true })
  const [filesKey, setFilesKey] = useState(0)

  const refresh = () => {
    api.status().then(d => {
      if (d) {
        setSys(d)
        onStatusChange?.(d.status)
      }
    })
  }

  const refreshAll = () => {
    refresh()
    setFilesKey(k => k + 1)
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [])

  const isUnderAttack = sys.status === 'critical' || sys.status === 'warning'

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5 space-y-4">

      {/* Row 1: Status + Score + Canary + Controls */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <SystemStatusCard status={sys.status} score={sys.threat_score} />
        </div>
        <div className="col-span-2">
          <ThreatScoreGauge score={Math.min(sys.threat_score, 100)} />
        </div>
        <div className="col-span-4">
          <CanaryAlertPanel triggered={sys.canary_hit} canaryIntact={sys.canary_intact ?? true} />
        </div>
        <div className="col-span-3">
          <AttackControlPanel onRefresh={refreshAll} systemStatus={sys.status} />
        </div>
      </div>

      {/* Row 2: Monitored files (real sandbox) + Live feed */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 h-72">
          <MonitoredFilesPanel key={filesKey} onRefresh={refreshAll} />
        </div>
        <div className="col-span-7 h-72">
          <LiveActivityFeed />
        </div>
      </div>

      {/* Row 3: Entropy graph */}
      <EntropyGraph />

      {/* Row 4: Monitored dirs + Snapshots + Quarantine */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <MonitoredPathsPanel />
        </div>
        <div className="col-span-5 h-72">
          <BackupSnapshotPanel />
        </div>
        <div className="col-span-4 h-72">
          <QuarantineViewer onRefresh={refreshAll} />
        </div>
      </div>

      {/* Row 5: Human defense */}
      <HumanDefensePanel />
    </div>
  )
}
