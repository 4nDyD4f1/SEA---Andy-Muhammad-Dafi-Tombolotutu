'use client'

import { useEffect, useState } from 'react'

export default function SellerIncomePage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const res = await fetch('/api/seller/income')
        const json = await res.json()
        if (res.ok) setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchIncome()
  }, [])

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-headline-lg font-bold">Ringkasan Pendapatan</h1>
        <p className="text-on-surface-variant">Lacak penjualan dan penghasilan toko Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 hero-gradient rounded-2xl p-6 md:p-8 text-white shadow-float relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              Total Pendapatan Bersih
            </p>
            {isLoading ? (
              <div className="h-12 w-48 bg-white/20 rounded animate-pulse mt-4"></div>
            ) : (
              <h1 className="text-4xl md:text-5xl font-black drop-shadow-sm mt-4">
                Rp {data?.totalIncome?.toLocaleString('id-ID') || '0'}
              </h1>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-6 bg-white flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-on-surface-variant font-semibold">Pesanan Sukses</span>
              <span className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </span>
            </div>
            {isLoading ? (
              <div className="h-8 w-16 shimmer rounded"></div>
            ) : (
              <h3 className="text-3xl font-black">{data?.successOrderCount || 0}</h3>
            )}
          </div>
          
          <div className="card p-6 bg-white flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-on-surface-variant font-semibold">Dikembalikan (Refund)</span>
              <span className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">undo</span>
              </span>
            </div>
            {isLoading ? (
              <div className="h-8 w-16 shimmer rounded"></div>
            ) : (
              <h3 className="text-3xl font-black text-error">{data?.refundedOrderCount || 0}</h3>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card bg-white p-6">
          <h2 className="text-title-md font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            Performa Bulanan
          </h2>
          
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-10 shimmer rounded"></div>
              <div className="h-10 shimmer rounded"></div>
            </div>
          ) : data?.monthlyData && Object.keys(data.monthlyData).length > 0 ? (
            <div className="divide-y divide-outline-variant">
              {Object.entries(data.monthlyData).map(([month, amount]: [string, any]) => (
                <div key={month} className="py-4 flex justify-between items-center">
                  <span className="font-semibold text-on-surface">{month}</span>
                  <span className="font-bold text-coral">Rp {amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-on-surface-variant">Belum ada data bulanan.</div>
          )}
        </div>

        <div className="card bg-white p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-outline-variant bg-surface-container-low">
            <h2 className="text-title-md font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Transaksi Terakhir
            </h2>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 shimmer rounded"></div>)}
              </div>
            ) : data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="divide-y divide-outline-variant">
                {data.recentOrders.map((order: any) => (
                  <div key={order.id} className="p-4 hover:bg-surface-container-lowest transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">Pesanan #{order.id.slice(-6).toUpperCase()}</span>
                      <span className="font-bold text-tertiary">+Rp {(order.subtotal - order.discountAmount).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-xs text-on-surface-variant flex justify-between">
                      <span>{order.buyer?.name}</span>
                      <span>{new Date(order.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-on-surface-variant">Belum ada transaksi berhasil.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
