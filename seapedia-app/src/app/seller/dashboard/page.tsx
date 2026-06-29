'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'

export default function SellerDashboard() {
  const router = useRouter()
  const toast = useToast()
  
  const [store, setStore] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [storeName, setStoreName] = useState('')
  const [storeDesc, setStoreDesc] = useState('')
  const [isCreatingStore, setIsCreatingStore] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch('/api/seller/products'),
          fetch('/api/seller/orders')
        ])
        
        const prodData = await prodRes.json()
        const orderData = await orderRes.json()
        
        if (prodRes.ok) {
          setStore(prodData.store)
          setProducts(prodData.products)
        }
        if (orderRes.ok) {
          setOrders(orderData.orders)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingStore(true)
    try {
      const res = await fetch('/api/seller/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeName, description: storeDesc })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Toko berhasil dibuat!')
        setStore(data)
        window.location.reload()
      } else {
        toast.error(data.error || 'Gagal membuat toko')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsCreatingStore(false)
    }
  }

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

  if (!store) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-primary-container text-primary rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[48px]">add_business</span>
          </div>
          <h1 className="text-headline-lg font-bold mb-2">Buka Toko Anda</h1>
          <p className="text-on-surface-variant">Langkah pertama untuk mulai berjualan di SEAPEDIA adalah membuat profil toko Anda.</p>
        </div>

        <div className="card bg-white p-6 md:p-8">
          <form onSubmit={handleCreateStore} className="space-y-5">
            <div>
              <label className="label">Nama Toko</label>
              <input 
                type="text" 
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="input"
                placeholder="Contoh: Elektronik Budi Jaya"
                required
              />
            </div>
            <div>
              <label className="label">Deskripsi Toko</label>
              <textarea 
                value={storeDesc}
                onChange={e => setStoreDesc(e.target.value)}
                className="input min-h-[120px] resize-y"
                placeholder="Ceritakan tentang produk yang Anda jual..."
                required
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={isCreatingStore || !storeName || !storeDesc}
              className="w-full btn-primary"
            >
              {isCreatingStore ? 'Memproses...' : 'Buka Toko Sekarang'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const processingOrders = orders.filter(o => o.status === 'SEDANG_DIKEMAS').length
  const newOrders = orders.filter(o => o.status === 'MENUNGGU_PENGIRIM').length
  const totalRevenue = orders.filter(o => o.status === 'PESANAN_SELESAI').reduce((acc, o) => acc + (o.subtotal - o.discountAmount), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold">Halo, {store.name} 👋</h1>
          <p className="text-on-surface-variant">Berikut adalah ringkasan performa toko Anda hari ini.</p>
        </div>
        <Link href="/seller/products/new" className="btn-primary shadow-float">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Produk
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-white flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider mb-1">Total Produk</p>
          <h2 className="text-3xl font-black">{products.length}</h2>
        </div>
        
        <div className="card p-6 bg-white flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined">hourglass_top</span>
          </div>
          <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider mb-1">Perlu Dikemas</p>
          <h2 className="text-3xl font-black text-secondary">{processingOrders}</h2>
        </div>
        
        <div className="card p-6 bg-white flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider mb-1">Menunggu Kurir</p>
          <h2 className="text-3xl font-black text-tertiary">{newOrders}</h2>
        </div>
        
        <div className="card p-6 bg-white flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider mb-1">Total Pendapatan</p>
          <h2 className="text-xl sm:text-2xl font-black text-purple-700">Rp {totalRevenue.toLocaleString('id-ID')}</h2>
        </div>
      </div>

      <div className="card bg-white overflow-hidden">
        <div className="p-4 md:p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h2 className="text-title-md font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Pesanan Terbaru
          </h2>
          <Link href="/seller/orders" className="text-sm font-semibold text-primary hover:underline">Lihat Semua</Link>
        </div>
        
        <div className="overflow-x-auto">
          {orders.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface border-b border-outline-variant text-on-surface-variant text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">ID Pesanan</th>
                  <th className="p-4 font-semibold">Pembeli</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4 font-mono text-sm">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="p-4">
                      <div className="font-semibold text-sm">{order.buyer?.name}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{order.items?.length} barang</div>
                    </td>
                    <td className="p-4 font-bold text-coral">Rp {(order.subtotal - order.discountAmount).toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              Belum ada pesanan masuk.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
