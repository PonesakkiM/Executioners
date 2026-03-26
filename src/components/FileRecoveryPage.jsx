import BackupSnapshotPanel from './BackupSnapshotPanel'
export default function FileRecoveryPage() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5 space-y-4">
      <p className="font-semibold text-lg" style={{ color: '#1a1a1a' }}>Backups</p>
      <div className="h-[600px]"><BackupSnapshotPanel /></div>
    </div>
  )
}
