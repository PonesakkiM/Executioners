import { useState } from 'react'
import LoginPage          from './components/LoginPage'
import Sidebar            from './components/Sidebar'
import Header             from './components/Header'
import Dashboard          from './components/Dashboard'
import ThreatActivityPage from './components/ThreatActivityPage'
import MonitoredPathsPanel from './components/MonitoredPathsPanel'
import QuarantineViewer   from './components/QuarantineViewer'
import FileRecoveryPage   from './components/FileRecoveryPage'
import SystemLogsPage     from './components/SystemLogsPage'
import HumanDefensePanel  from './components/HumanDefensePanel'
import SettingsPage       from './components/SettingsPage'

const pages = {
  dashboard:  Dashboard,
  threats:    ThreatActivityPage,
  folders:    () => <div className="p-5 space-y-4"><p className="text-white font-semibold text-lg">Monitored Folders</p><MonitoredPathsPanel /></div>,
  quarantine: () => <div className="p-5 space-y-4"><p className="text-white font-semibold text-lg">Quarantine</p><QuarantineViewer /></div>,
  backups:    FileRecoveryPage,
  logs:       SystemLogsPage,
  awareness:  () => <div className="p-5 space-y-4"><p className="text-white font-semibold text-lg">Human Awareness</p><HumanDefensePanel /></div>,
  settings:   SettingsPage,
}

export default function App() {
  const [user, setUser]     = useState(null)
  const [page, setPage]     = useState('dashboard')
  const [status, setStatus] = useState('secure')

  if (!user) return <LoginPage onLogin={setUser} />

  const Page = pages[page] ?? Dashboard

  return (
    <div className="flex h-screen overflow-hidden bg-navy">
      <Sidebar active={page} onNavigate={setPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header status={status} user={user} onLogout={() => setUser(null)} />
        <main className="flex-1 overflow-hidden">
          <Page onStatusChange={setStatus} />
        </main>
      </div>
    </div>
  )
}
