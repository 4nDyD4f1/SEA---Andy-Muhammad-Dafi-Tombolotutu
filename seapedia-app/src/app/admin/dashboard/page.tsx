'use client'

import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        if (res.ok) setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
    // Auto-refresh every 30s
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 shimmer rounded-xl w-full"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 shimmer rounded-xl w-full"></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            God-Eye Monitor
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Ringkasan keseluruhan ekosistem SEAPEDIA.</p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          LIVE DATA
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-white border-l-4 border-l-primary border-y border-r border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total User</span>
          </div>
          <h2 className="text-3xl font-black text-on-surface">{stats?.users?.total || 0}</h2>
          <div className="text-xs text-on-surface-variant mt-2 flex gap-2">
            <span>B: {stats?.users?.buyers || 0}</span>
            <span>S: {stats?.users?.sellers || 0}</span>
            <span>D: {stats?.users?.drivers || 0}</span>
          </div>
        </div>

        <div className="card p-6 bg-white border-l-4 border-l-coral border-y border-r border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Order</span>
          </div>
          <h2 className="text-3xl font-black text-on-surface">{stats?.orders?.total || 0}</h2>
          <div className="text-xs text-on-surface-variant mt-2">
            <span className="text-coral font-semibold">{stats?.orders?.active || 0} Aktif</span> | {stats?.orders?.completed || 0} Selesai
          </div>
        </div>

        <div className="card p-6 bg-white border-l-4 border-l-tertiary border-y border-r border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Transaksi</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface truncate">
            Rp {(stats?.financials?.totalTransactionValue || 0).toLocaleString('id-ID')}
          </h2>
          <div className="text-xs text-on-surface-variant mt-2">
            Gross Merchandise Value (GMV)
          </div>
        </div>

        <div className="card p-6 bg-white border-l-4 border-l-error border-y border-r border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">SLA Pelanggaran</span>
          </div>
          <h2 className="text-3xl font-black text-error">{stats?.orders?.refunded || 0}</h2>
          <div className="text-xs text-on-surface-variant mt-2">
            Pesanan direfund otomatis
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-white border border-outline-variant shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-outline-variant pb-2 text-on-surface">
            <span className="material-symbols-outlined text-on-surface-variant">pie_chart</span>
            Distribusi Status Pesanan
          </h2>
          <div className="space-y-3">
            {stats?.ordersByStatus && stats.ordersByStatus.map((status: any) => (
              <div key={status.status} className="flex items-center gap-4">
                <div className="w-48 text-sm font-semibold text-on-surface-variant truncate">
                  {status.status.replace(/_/g, ' ')}
                </div>
                <div className="flex-grow h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${Math.max(2, (status._count / (stats?.orders?.total || 1)) * 100)}%` }}
                  ></div>
                </div>
                <div className="w-12 text-right font-mono text-sm font-bold text-on-surface">{status._count}</div>
              </div>
            ))}
            {(!stats?.ordersByStatus || stats.ordersByStatus.length === 0) && (
              <p className="text-sm text-center text-outline-variant py-4">Belum ada data pesanan</p>
            )}
          </div>
        </div>

        <div className="card bg-white border border-outline-variant shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-outline-variant pb-2 text-on-surface">
            <span className="material-symbols-outlined text-primary">local_activity</span>
            Penggunaan Voucher
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-lg border border-outline-variant/50">
              <span className="text-sm font-semibold text-on-surface-variant">Total Voucher Digunakan</span>
              <span className="font-bold text-on-surface">{stats?.financials?.totalVoucherUsage || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-lg border border-outline-variant/50">
              <span className="text-sm font-semibold text-on-surface-variant">Total Diskon Diberikan</span>
              <span className="font-bold text-coral">Rp {(stats?.financials?.totalDiscountGiven || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
