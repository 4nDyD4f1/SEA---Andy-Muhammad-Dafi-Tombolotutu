'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { ImageUploader } from '@/components/ui/ImageUploader'

export default function NewProductPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    originalPrice: '',
    discountPercent: '',
    finalPrice: '',
    stock: '',
    category: 'Elektronik',
    images: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'originalPrice' || name === 'finalPrice') {
      const rawValue = value.replace(/\D/g, '')
      const formattedValue = rawValue ? parseInt(rawValue, 10).toLocaleString('id-ID') : ''
      setFormData(prev => ({ ...prev, [name]: formattedValue }))
    } else if (name === 'discountPercent') {
      let rawValue = value.replace(/\D/g, '')
      if (Number(rawValue) > 100) rawValue = '100'
      setFormData(prev => ({ ...prev, [name]: rawValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setFormData(prev => {
      const orig = Number(prev.originalPrice.replace(/\./g, '')) || 0
      const final = Number(prev.finalPrice.replace(/\./g, '')) || 0
      const disc = Number(prev.discountPercent) || 0

      let newDisc = prev.discountPercent
      let newFinal = prev.finalPrice

      if (name === 'originalPrice') {
        if (orig > 0 && final > 0) {
          let calcDisc = Math.round(((orig - final) / orig) * 100)
          if (calcDisc < 0) calcDisc = 0
          if (calcDisc > 100) calcDisc = 100
          newDisc = calcDisc > 0 ? calcDisc.toString() : ''
        } else if (orig > 0 && final === 0) {
          newFinal = orig.toLocaleString('id-ID')
          newDisc = ''
        }
      } else if (name === 'discountPercent') {
        if (orig > 0) {
          const calcFinal = Math.round(orig - (orig * disc / 100))
          newFinal = calcFinal > 0 ? calcFinal.toLocaleString('id-ID') : ''
        }
      } else if (name === 'finalPrice') {
        if (orig > 0 && final > 0) {
          let calcDisc = Math.round(((orig - final) / orig) * 100)
          if (calcDisc < 0) calcDisc = 0
          if (calcDisc > 100) calcDisc = 100
          newDisc = calcDisc > 0 ? calcDisc.toString() : ''
        }
      }

      return {
        ...prev,
        discountPercent: newDisc,
        finalPrice: newFinal
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const originalPriceNum = Number(formData.originalPrice.toString().replace(/\./g, '')) || 0
    const finalPriceNum = Number(formData.finalPrice.toString().replace(/\./g, '')) || 0
    const discountNum = Number(formData.discountPercent) || 0
      
    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: finalPriceNum > 0 ? finalPriceNum : originalPriceNum,
          originalPrice: discountNum > 0 ? originalPriceNum : null,
          stock: Number(formData.stock)
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Produk berhasil ditambahkan!')
        router.push('/seller/products')
      } else {
        if (data.details && data.details.fieldErrors) {
          console.error(data.details)
          const messages = Object.entries(data.details.fieldErrors).map(([key, errors]: [string, any]) => `${key}: ${errors?.[0]}`).join(', ')
          toast.error(`Validasi gagal: ${messages}` || data.error)
        } else {
          toast.error(data.error || 'Gagal menambahkan produk')
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/seller/products" className="p-2 bg-white rounded-full border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-headline-lg font-bold">Tambah Produk</h1>
          <p className="text-on-surface-variant">Jual produk baru di toko Anda.</p>
        </div>
      </div>

      <div className="card bg-white p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="label">Nama Produk *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="Contoh: Sepatu Kets Pria"
                required
                minLength={2}
                maxLength={200}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Harga Asli (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant font-semibold">Rp</span>
                  <input 
                    type="text" 
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input pl-12 font-bold"
                    placeholder="Contoh: 150.000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label text-on-surface-variant">Diskon (%)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="discountPercent"
                    value={formData.discountPercent}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input pr-12 text-primary font-bold"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant font-semibold">%</span>
                </div>
              </div>
              <div>
                <label className="label text-on-surface-variant">Harga Jual (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant font-semibold">Rp</span>
                  <input 
                    type="text" 
                    name="finalPrice"
                    value={formData.finalPrice}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input pl-12 font-bold focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Stok *</label>
                <input 
                  type="number" 
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="input"
                  placeholder="0"
                  required
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className="label">Kategori *</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input appearance-none"
                required
              >
                <option value="Elektronik">Elektronik</option>
                <option value="Fashion">Fashion</option>
                <option value="Makanan & Minuman">Makanan & Minuman</option>
                <option value="Otomotif">Otomotif</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Hobi">Hobi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="label">Foto Produk (Multi)</label>
              <ImageUploader 
                images={formData.images} 
                onChange={(imgs) => setFormData({ ...formData, images: imgs })}
                maxImages={5}
              />
            </div>

            <div>
              <label className="label">Deskripsi Produk</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input min-h-[150px] resize-y"
                placeholder="Jelaskan detail produk Anda (spesifikasi, bahan, ukuran, dll)..."
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant flex justify-end gap-3">
            <Link href="/seller/products" className="btn-outline px-6">Batal</Link>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-8">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
