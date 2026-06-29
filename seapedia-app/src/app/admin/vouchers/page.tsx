'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    minPurchase: '',
    validUntil: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers')
      const data = await res.json()
      if (res.ok) setVouchers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discountType: 'FIXED',
          discountValue: Number(formData.discount),
          maxUsage: 100, // Default for now
          minPurchase: Number(formData.minPurchase),
          expiresAt: new Date(formData.validUntil).toISOString()
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Voucher berhasil dibuat!')
        setFormData({ code: '', discount: '', minPurchase: '', validUntil: '' })
        fetchVouchers() // refresh list
      } else {
        toast.error(data.error || 'Gagal membuat voucher')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Hapus voucher ${code}?`)) return
    
    try {
      const res = await fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Voucher dihapus')
        setVouchers(vouchers.filter(v => v.id !== id))
      } else {
        toast.error('Gagal menghapus voucher')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/3">
        <div className="card bg-white p-6 sticky top-24">
          <h2 className="text-title-md font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_box</span>
            Buat Voucher Baru
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Kode Voucher</label>
              <input 
                type="text" 
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="input uppercase"
                placeholder="Contoh: MERDEKA50"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="label">Potongan Harga (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant font-semibold">Rp</span>
                <input 
                  type="number" 
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  className="input pl-12"
                  placeholder="50000"
                  min="1000"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="label">Minimal Belanja (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant font-semibold">Rp</span>
                <input 
                  type="number" 
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleChange}
                  className="input pl-12"
                  placeholder="100000"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="label">Berlaku Sampai</label>
              <input 
                type="datetime-local" 
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="w-full btn-primary mt-2">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Voucher'}
            </button>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-2/3">
        <div className="card bg-white p-6">
          <h2 className="text-title-md font-bold mb-4 flex items-center gap-2 border-b border-outline-variant pb-4">
            <span className="material-symbols-outlined text-primary">local_activity</span>
            Daftar Voucher Aktif
          </h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-lg"></div>)}
            </div>
          ) : vouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map(voucher => {
                const isActive = voucher.expiresAt ? new Date(voucher.expiresAt) > new Date() : true
                return (
                  <div key={voucher.id} className={`border rounded-lg p-4 relative overflow-hidden ${isActive ? 'bg-primary/5 border-primary/30' : 'bg-surface-variant/30 border-outline-variant opacity-70'}`}>
                    {/* decorative circles */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-outline-variant/30"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-outline-variant/30"></div>
                    
                    <div className="pl-4 border-l border-dashed border-outline-variant flex justify-between items-start h-full">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-mono font-bold text-lg ${isActive ? 'text-primary' : 'text-outline'}`}>
                            {voucher.code}
                          </span>
                          {!isActive && <span className="text-[10px] bg-error text-white px-1.5 rounded-sm font-bold">EXPIRED</span>}
                        </div>
                        <h4 className="font-bold text-coral">Diskon Rp {voucher.discountValue.toLocaleString('id-ID')}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Min. Belanja: Rp {voucher.minPurchase.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-outline mt-2 font-mono">
                          Exp: {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tidak ada batas'}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(voucher.id, voucher.code)}
                        className="text-outline hover:text-error transition-colors p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              Belum ada voucher yang dibuat.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
