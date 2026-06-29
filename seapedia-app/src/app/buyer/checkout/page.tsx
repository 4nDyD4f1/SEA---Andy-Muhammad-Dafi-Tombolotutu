'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, storeId, storeName, getTotal, clearCart } = useCartStore()
  const { user, updateWallet } = useAuthStore()
  const toast = useToast()

  const [address, setAddress] = useState('')
  const [courier, setCourier] = useState('REGULAR')
  
  // Regional Address State
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  
  const [selectedProv, setSelectedProv] = useState({ id: '', name: '' })
  const [selectedCity, setSelectedCity] = useState({ id: '', name: '' })
  const [selectedDist, setSelectedDist] = useState({ id: '', name: '' })
  const [postalCode, setPostalCode] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [userVouchers, setUserVouchers] = useState<any[]>([])
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isVoucherApplied, setIsVoucherApplied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const courierFees: Record<string, { label: string; price: number; desc: string }> = {
    INSTANT: { label: 'Instant', price: 25000, desc: 'Sampai dalam 3 jam' },
    NEXT_DAY: { label: 'Next Day', price: 15000, desc: 'Sampai besok' },
    REGULAR: { label: 'Regular', price: 10000, desc: '2-4 hari kerja' },
  }

  const subtotal = getTotal()
  const shippingFee = courierFees[courier].price
  
  // Tax logic: (Subtotal - Discount + Shipping) * 12%
  const baseForTax = Math.max(0, subtotal - discountAmount) + shippingFee
  const tax = baseForTax * 0.12
  const finalTotal = baseForTax + tax

  useEffect(() => {
    if (items.length === 0) {
      router.push('/buyer/cart')
    }
  }, [items, router])

  // Fetch Provinces and Vouchers
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error(err))
      
    if (user?.id) {
      fetch('/api/buyer/vouchers')
        .then(res => res.json())
        .then(data => {
          if(Array.isArray(data)) setUserVouchers(data.filter(uv => !uv.isUsed))
        })
        .catch(err => console.error(err))
    }
  }, [user?.id])

  // Fetch Cities when Province changes
  useEffect(() => {
    if (selectedProv.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProv.id}.json`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error(err))
      setSelectedCity({ id: '', name: '' })
      setDistricts([])
      setSelectedDist({ id: '', name: '' })
    }
  }, [selectedProv.id])

  // Fetch Districts when City changes
  useEffect(() => {
    if (selectedCity.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`)
        .then(res => res.json())
        .then(data => setDistricts(data))
        .catch(err => console.error(err))
      setSelectedDist({ id: '', name: '' })
    }
  }, [selectedCity.id])

  const applyVoucher = async () => {
    if (!voucherCode) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/vouchers/validate?code=${voucherCode}&subtotal=${subtotal}&storeId=${storeId || ''}`)
      const data = await res.json()
      
      if (data.valid) {
        setDiscountAmount(data.discountAmount)
        setIsVoucherApplied(true)
        toast.success(`Voucher berhasil dipasang! Diskon Rp ${data.discountAmount.toLocaleString('id-ID')}`)
      } else {
        toast.error(data.error)
        setDiscountAmount(0)
        setIsVoucherApplied(false)
      }
    } catch (err) {
      toast.error('Gagal memvalidasi voucher')
    } finally {
      setIsProcessing(false)
    }
  }

  const removeVoucher = () => {
    setVoucherCode('')
    setDiscountAmount(0)
    setIsVoucherApplied(false)
  }

  const handleCheckout = async () => {
    const fullAddress = `${streetAddress}, Kecamatan ${selectedDist.name}, ${selectedCity.name}, Provinsi ${selectedProv.name}, ${postalCode}`
    
    if (!selectedProv.id || !selectedCity.id || !selectedDist.id || !postalCode || streetAddress.length < 5) {
      toast.error('Mohon lengkapi data alamat pengiriman Anda')
      return
    }

    if (!user || user.walletBalance < finalTotal) {
      toast.error(`Saldo Anda (Rp ${user?.walletBalance.toLocaleString('id-ID')}) tidak cukup untuk membayar tagihan. Silakan Top-Up.`)
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch('/api/buyer/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: fullAddress,
          courierType: courier,
          voucherCode: isVoucherApplied ? voucherCode : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Pesanan berhasil dibuat!')
        updateWallet(user.walletBalance - finalTotal)
        clearCart()
        router.push('/buyer/orders')
      } else {
        toast.error(data.error || 'Gagal membuat pesanan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-headline-lg font-bold">Pengiriman &amp; Pembayaran</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Address Section */}
          <div className="card p-6 bg-white">
            <h2 className="text-title-md font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              Alamat Pengiriman
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Provinsi</label>
                <select 
                  className="input cursor-pointer"
                  value={selectedProv.id}
                  onChange={(e) => {
                    const prov = provinces.find(p => p.id === e.target.value)
                    setSelectedProv(prov || { id: '', name: '' })
                  }}
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Kota / Kabupaten</label>
                <select 
                  className="input cursor-pointer"
                  value={selectedCity.id}
                  onChange={(e) => {
                    const city = cities.find(c => c.id === e.target.value)
                    setSelectedCity(city || { id: '', name: '' })
                  }}
                  disabled={!selectedProv.id}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Kecamatan</label>
                <select 
                  className="input cursor-pointer"
                  value={selectedDist.id}
                  onChange={(e) => {
                    const dist = districts.find(d => d.id === e.target.value)
                    setSelectedDist(dist || { id: '', name: '' })
                  }}
                  disabled={!selectedCity.id}
                >
                  <option value="">Pilih Kecamatan</option>
                  {districts.map(dist => (
                    <option key={dist.id} value={dist.id}>{dist.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Kode Pos</label>
                <input 
                  type="text" 
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Contoh: 12345"
                  className="input"
                />
              </div>
            </div>
            
            <div>
               <label className="text-sm font-semibold mb-1.5 block">Detail Alamat (Jalan, RT/RW, Patokan)</label>
               <textarea 
                 value={streetAddress}
                 onChange={(e) => setStreetAddress(e.target.value)}
                 placeholder="Nama jalan, gedung, no. rumah, blok..."
                 className="input min-h-[80px] resize-y"
               ></textarea>
            </div>
          </div>

          {/* Courier Section */}
          <div className="card p-6 bg-white">
            <h2 className="text-title-md font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Pilih Pengiriman
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(courierFees).map(([key, info]) => (
                <div 
                  key={key}
                  onClick={() => setCourier(key)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    courier === key 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                      : 'border-outline-variant hover:border-outline'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">{info.label}</span>
                    {courier === key && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3">{info.desc}</p>
                  <p className="font-semibold text-primary">Rp {info.price.toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Items Preview */}
          <div className="card p-6 bg-white">
            <h2 className="text-title-md font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Pesanan Anda dari {storeName}
            </h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between items-center text-sm border-b border-outline-variant/30 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{item.quantity}x</span>
                    <span className="line-clamp-1">{item.product.name}</span>
                  </div>
                  <span className="font-medium">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="card p-6 bg-white sticky top-24">
            <h2 className="text-title-md font-bold mb-4">Ringkasan Pembayaran</h2>
            
            {/* Voucher Section */}
            <div className="mb-6 space-y-3">
              <label className="text-sm font-semibold block">Gunakan Voucher</label>
              
              {/* Manual Code Input */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  disabled={isVoucherApplied || isProcessing}
                  placeholder="Ketik kode voucher..."
                  className="input flex-grow uppercase tracking-widest"
                />
                {!isVoucherApplied ? (
                  <button 
                    onClick={applyVoucher}
                    disabled={!voucherCode || isProcessing}
                    className="btn-secondary px-4 whitespace-nowrap"
                  >
                    Terapkan
                  </button>
                ) : (
                  <button 
                    onClick={removeVoucher}
                    disabled={isProcessing}
                    className="btn-outline px-4 !border-error !text-error hover:!bg-error hover:!text-white"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Claimed Vouchers Picker */}
              {userVouchers.length > 0 && !isVoucherApplied && (
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Atau pilih dari voucher tersimpan:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {userVouchers.map(uv => (
                      <button
                        key={uv.id}
                        onClick={() => setVoucherCode(uv.voucher.code)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                          voucherCode === uv.voucher.code 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-outline-variant hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        <span className="font-bold tracking-wider">{uv.voucher.code}</span>
                        <span className="text-xs">
                          {uv.voucher.discountType === 'FIXED' 
                            ? `Diskon Rp${uv.voucher.discountValue.toLocaleString('id-ID')}` 
                            : `Diskon ${uv.voucher.discountValue}%`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isVoucherApplied && (
                <div className="flex items-center gap-2 text-sm text-tertiary font-medium bg-tertiary/10 px-3 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Voucher <strong>{voucherCode}</strong> berhasil diterapkan!
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total Harga ({items.length} barang)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ongkos Kirim ({courierFees[courier].label})</span>
                <span>Rp {shippingFee.toLocaleString('id-ID')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-tertiary font-medium">
                  <span>Diskon Voucher</span>
                  <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-on-surface-variant">PPN 12%</span>
                <span>Rp {Math.round(tax).toLocaleString('id-ID')}</span>
              </div>
            </div>
            
            <div className="divider"></div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg">Total Tagihan</span>
              <span className="font-black text-xl text-coral">Rp {Math.round(finalTotal).toLocaleString('id-ID')}</span>
            </div>

            <div className={`p-3 rounded-lg mb-6 flex items-center gap-3 ${user?.walletBalance && user.walletBalance >= finalTotal ? 'bg-primary/10' : 'bg-error-container text-on-error-container'}`}>
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5">Saldo Wallet</p>
                <p className="font-bold text-sm">Rp {user?.walletBalance.toLocaleString('id-ID')}</p>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className="btn-primary w-full shadow-float text-base py-3 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  Bayar Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
