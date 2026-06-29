'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

export default function SellerVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState('FIXED')
  const [discountValue, setDiscountValue] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('7')

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/seller/vouchers')
      if (res.ok) {
        const data = await res.json()
        setVouchers(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !discountValue) return
    setIsSubmitting(true)

    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays))

      const res = await fetch('/api/seller/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description,
          discountType,
          discountValue: discountType === 'FIXED' ? Number(discountValue.toString().replace(/\./g, '')) : parseFloat(discountValue),
          minPurchase: Number(minPurchase.toString().replace(/\./g, '')) || 0,
          expiresAt: expiresAt.toISOString()
        })
      })

      if (res.ok) {
        toast.success('Voucher berhasil dibuat!')
        setIsModalOpen(false)
        setCode('')
        setDescription('')
        setDiscountValue('')
        setMinPurchase('')
        fetchVouchers()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal membuat voucher')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manajemen Voucher</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">add</span> Buat Voucher Baru
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-outline-variant/20">
        <h2 className="text-lg font-bold mb-6 text-on-surface tracking-tight">Voucher Toko</h2>
        
        {isLoading ? (
          <div className="text-center py-10 text-outline">Memuat voucher...</div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-10 text-outline">Belum ada voucher yang dibuat.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map(v => (
              <div key={v.id} className="relative flex items-center bg-[#F4F9FF] border border-[#C5DFF8] rounded-lg h-28 overflow-hidden hover:shadow-sm transition-shadow">
                {/* Left semi-circle cutout */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border-r border-[#C5DFF8]"></div>
                
                <div className="flex-grow pl-8 pr-4 py-4 border-r border-dashed border-[#C5DFF8]">
                  <h3 className="text-[#0A58CA] font-bold text-lg leading-tight mb-1">
                    {v.discountType === 'FIXED' ? `Diskon Rp${(v.discountValue / 1000).toLocaleString('id-ID')}RB` : `Diskon ${v.discountValue}%`}
                  </h3>
                  <p className="text-[#5C636A] text-[13px] mb-1">Min. Blj Rp{(v.minPurchase / 1000).toLocaleString('id-ID')}RB</p>
                  <p className="text-[#3D8BFD] text-[11px] font-medium">Berakhir: {new Date(v.expiresAt).toLocaleDateString('id-ID')}</p>
                </div>
                
                <div className="w-28 shrink-0 flex flex-col items-center justify-center p-3">
                  <div className="text-xs font-bold text-center mb-1 text-[#0A58CA] bg-white px-2 py-0.5 rounded border border-[#C5DFF8]">{v.code}</div>
                  <button className="bg-[#0A58CA] text-white text-sm font-bold py-1.5 w-full rounded hover:bg-[#084298] transition-colors shadow-sm mt-1">
                    Ubah
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE VOUCHER MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Buat Voucher Baru">
        <form onSubmit={handleCreateVoucher} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Kode Voucher</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: PROMO123"
              className="input w-full uppercase"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Tipe Diskon</label>
              <select className="input w-full" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="FIXED">Nominal (Rp)</option>
                <option value="PERCENTAGE">Persentase (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Nilai Diskon</label>
              <input 
                type={discountType === 'FIXED' ? 'text' : 'number'}
                value={discountValue}
                onChange={(e) => {
                  if (discountType === 'FIXED') {
                    const rawValue = e.target.value.replace(/\D/g, '')
                    setDiscountValue(rawValue ? parseInt(rawValue, 10).toLocaleString('id-ID') : '')
                  } else {
                    setDiscountValue(e.target.value)
                  }
                }}
                placeholder={discountType === 'FIXED' ? "Cth: 10.000" : "Cth: 15"}
                className="input w-full"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Syarat Minimum Belanja (Rp)</label>
            <input 
              type="text" 
              value={minPurchase}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, '')
                setMinPurchase(rawValue ? parseInt(rawValue, 10).toLocaleString('id-ID') : '')
              }}
              placeholder="Cth: 50.000"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Masa Berlaku (Hari)</label>
            <input 
              type="number" 
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="input w-full"
              min="1"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-outline-variant/30">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="btn-outline px-6">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
              {isSubmitting ? 'Membuat...' : 'Buat Voucher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
