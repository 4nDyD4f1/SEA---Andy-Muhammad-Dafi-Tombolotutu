'use client'

import { useEffect, useState } from 'react'

export default function DriverEarningsPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch('/api/driver/earnings')
        const json = await res.json()
        if (res.ok) setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEarnings()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-md font-bold">Dompet & Komisi</h1>
        <p className="text-on-surface-variant text-sm">Ringkasan pendapatan pengiriman Anda.</p>
      </div>

      <div className="coral-gradient rounded-2xl p-6 text-white shadow-float relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620325867502-221ddb5faa5f?q=80&w=1000')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              Saldo Wallet
            </p>
            {isLoading ? (
              <div className="h-10 w-32 bg-white/20 rounded animate-pulse"></div>
            ) : (
              <h2 className="text-4xl font-black drop-shadow-sm">
                Rp {data?.walletBalance?.toLocaleString('id-ID') || '0'}
              </h2>
            )}
          </div>
          
          <div className="flex gap-4 border-t border-white/20 pt-4">
            <div className="flex-1">
              <p className="text-[10px] text-white/70 uppercase mb-0.5">Total Komisi</p>
              <p className="font-bold text-sm">Rp {data?.totalEarnings?.toLocaleString('id-ID') || '0'}</p>
            </div>
            <div className="w-[1px] bg-white/20"></div>
            <div className="flex-1">
              <p className="text-[10px] text-white/70 uppercase mb-0.5">Selesai</p>
              <p className="font-bold text-sm">{data?.completedDeliveries || 0} trip</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-white p-0 overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">history</span>
            Riwayat Pengiriman
          </h2>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-14 shimmer rounded"></div>)}
            </div>
          ) : data?.completedOrders && data.completedOrders.length > 0 ? (
            <div className="divide-y divide-outline-variant">
              {data.completedOrders.map((order: any) => (
                <div key={order.id} className="p-4 hover:bg-surface-container-lowest transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm">#{order.id.slice(-6).toUpperCase()}</h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[12px]">store</span>
                      {order.store?.name}
                    </p>
                    <p className="text-[10px] text-outline mt-1">
                      {new Date(order.completedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-tertiary">+Rp {order.driverCommission.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant inline-block mt-1">
                      {order.courierType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-on-surface-variant text-sm">
              Belum ada riwayat pengiriman.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
