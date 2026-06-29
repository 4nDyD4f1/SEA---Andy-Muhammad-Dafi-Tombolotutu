'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function ActiveOrdersPage() {
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    fetchActiveOrders()
  }, [])

  const fetchActiveOrders = async () => {
    try {
      const res = await fetch('/api/driver/earnings') // earnings API also returns activeOrders
      const data = await res.json()
      if (res.ok) setActiveOrders(data.activeOrders || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    if (!confirm('Pastikan paket sudah diterima oleh pembeli. Konfirmasi selesai?')) return
    
    setCompletingId(id)
    try {
      const res = await fetch(`/api/driver/jobs/${id}/complete`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Pengiriman berhasil diselesaikan! Komisi ditambahkan.')
        setActiveOrders(activeOrders.filter(o => o.id !== id))
      } else {
        toast.error(data.error || 'Gagal mengkonfirmasi')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-md font-bold">Pesanan Aktif</h1>
        <p className="text-on-surface-variant text-sm">Pesanan yang sedang Anda kirim saat ini.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card p-6 h-48 shimmer"></div>)}
        </div>
      ) : activeOrders.length > 0 ? (
        <div className="space-y-4">
          {activeOrders.map(order => (
            <div key={order.id} className="card bg-white overflow-hidden border-2 border-primary/20">
              <div className="p-4 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-[18px]">electric_moped</span>
                  Sedang Mengirim
                </div>
                <span className="font-mono text-xs text-outline-variant">#{order.id.slice(-6).toUpperCase()}</span>
              </div>
              
              <div className="p-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="material-symbols-outlined text-coral mt-0.5">location_on</span>
                    <div>
                      <p className="text-xs text-on-surface-variant mb-0.5">Alamat Pengiriman:</p>
                      <p className="text-sm font-semibold leading-tight">{order.shippingAddress}</p>
                      <p className="text-xs font-medium text-primary mt-1">Penerima: {order.buyer?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-lg mb-4">
                  <span className="text-sm font-medium">Komisi Pengiriman</span>
                  <span className="font-bold text-tertiary">Rp {order.driverCommission.toLocaleString('id-ID')}</span>
                </div>
                
                <button 
                  onClick={() => handleComplete(order.id)}
                  disabled={completingId === order.id}
                  className="w-full btn-primary shadow-float py-3"
                >
                  {completingId === order.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Memproses...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      Konfirmasi Selesai
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant shadow-sm">
          <div className="w-20 h-20 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
            <span className="material-symbols-outlined text-[40px]">map</span>
          </div>
          <h3 className="text-title-md font-bold text-on-surface">Tidak ada pesanan aktif</h3>
          <p className="text-on-surface-variant mt-2 text-sm max-w-[320px] mx-auto">Ambil job baru di Job Board untuk mulai mengirim.</p>
        </div>
      )}
    </div>
  )
}
