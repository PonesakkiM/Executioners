import BackupSnapshotPanel from './BackupSnapshotPanel'
export default function FileRecoveryPage() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5 space-y-4">
      <p className="text-white font-semibold text-lg">Backups</p>
      <div className="h-[600px]"><BackupSnapshotPanel /></div>
    </div>
  )
}
