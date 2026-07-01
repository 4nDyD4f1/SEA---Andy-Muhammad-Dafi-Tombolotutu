'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function RegisterPage() {
  const router = useRouter()
  const { user, activeRole, setAuth } = useAuthStore()
  const toast = useToast()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('BUYER')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (user) {
      try {
        const roles = user.roles || []
        const targetRole = activeRole || roles[0] || 'BUYER'
        if (targetRole === 'BUYER') router.push('/buyer')
        else if (targetRole === 'SELLER') router.push('/seller/dashboard')
        else if (targetRole === 'DRIVER') router.push('/driver/dashboard')
        else if (targetRole === 'ADMIN') router.push('/admin/dashboard')
        else router.push('/')
      } catch (err) {
        console.error("Redirect error", err)
      }
    }
  }, [user, activeRole, router])

  if (mounted && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const checkPasswordStrength = (pass: string) => {
    if (!pass) return 0
    let score = 0
    if (pass.length > 5) score += 1
    if (pass.length > 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    return Math.min(score, 4) // Max 4
  }

  const strength = checkPasswordStrength(password)
  const strengthColors = ['bg-surface-variant', 'bg-error', 'bg-[#ff9800]', 'bg-primary', 'bg-tertiary']
  const strengthLabels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Password dan Konfirmasi Password tidak cocok')
      return
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: selectedRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftar')
      }

      toast.success('Pendaftaran berhasil!')
      setAuth(data.user, data.token)
      
      // Navigate directly based on chosen role
      switch(data.user.activeRole) {
        case 'SELLER': router.push('/seller/dashboard'); break;
        case 'DRIVER': router.push('/driver/dashboard'); break;
        default: router.push('/buyer'); break;
      }

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white selection:bg-coral/20">
      {/* 
        ========================================================================
        BAGIAN KIRI: FORMULIR PENDAFTARAN
        Area ini adalah area utama untuk pengguna mendaftar.
        ========================================================================
      */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-y-auto hide-scrollbar order-2 md:order-1">
        {/* Mobile Branding */}
        <div className="absolute top-6 left-6 md:hidden z-20">
          <Link href="/" className="inline-block">
            <Image src="/SEAPEDIA-LOGO.png" alt="SEAPEDIA" width={240} height={70} className="h-14 sm:h-16 w-auto object-contain drop-shadow-sm" priority />
          </Link>
        </div>

        <div className="w-full max-w-[448px] animate-slide-up mt-12 md:mt-0">
          <div className="mb-8">
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-coral transition-colors mb-6">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Kembali ke Login
            </Link>
            <h2 className="text-3xl font-bold text-on-surface mb-3 tracking-tight">Daftar Akun Baru 🚀</h2>
            <p className="text-on-surface-variant">
              Sudah punya akun?{' '}
              <Link href="/auth/login" className="text-coral font-bold hover:text-secondary transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 group">
              <label className="text-sm font-semibold text-on-surface">
                Daftar Sebagai:
              </label>
              <div className="grid grid-cols-3 gap-3 mb-2">
                {[
                  { id: 'BUYER', icon: 'shopping_bag', label: 'Pembeli' },
                  { id: 'SELLER', icon: 'storefront', label: 'Penjual' },
                  { id: 'DRIVER', icon: 'local_shipping', label: 'Driver' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedRole === r.id ? 'border-coral bg-coral/10 text-coral shadow-sm scale-105' : 'border-surface-container-high hover:border-outline-variant text-on-surface-variant'}`}
                  >
                    <span className={`material-symbols-outlined mb-1 ${selectedRole === r.id ? 'material-symbols-filled' : ''}`}>{r.icon}</span>
                    <span className="text-xs font-bold">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-sm font-semibold text-on-surface group-focus-within:text-coral transition-colors">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-coral transition-colors">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral/10 transition-all placeholder:text-outline-variant font-medium"
                  placeholder="Nama Lengkap Anda"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-sm font-semibold text-on-surface group-focus-within:text-coral transition-colors">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-coral transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral/10 transition-all placeholder:text-outline-variant font-medium"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-sm font-semibold text-on-surface group-focus-within:text-coral transition-colors">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-coral transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral/10 transition-all placeholder:text-outline-variant font-medium tracking-wide"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              
              {/* Animated Password Strength Meter */}
              <div className="pt-2">
                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-surface-container-high">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${strengthColors[strength]}`} 
                    style={{ width: password.length === 0 ? '0%' : `${(Math.max(1, strength) / 4) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-outline-variant font-medium uppercase tracking-wider">Keamanan</span>
                  <span className={`text-[10px] font-bold ${password.length === 0 ? 'text-transparent' : strength > 2 ? 'text-tertiary' : strength === 2 ? 'text-[#ff9800]' : 'text-error'}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-sm font-semibold text-on-surface group-focus-within:text-coral transition-colors">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-coral transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-11 pr-12 py-3 bg-surface-container-lowest border-2 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-4 transition-all placeholder:text-outline-variant font-medium tracking-wide ${confirmPassword && confirmPassword !== password ? 'border-error focus:border-error focus:ring-error/10 text-error' : 'border-surface-container-high focus:border-coral focus:ring-coral/10'}`}
                  placeholder="Ulangi password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-error text-xs mt-1.5 font-bold animate-slide-down flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Password tidak cocok
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || (password !== confirmPassword) || password.length < 6}
              className="w-full mt-4 bg-coral hover:bg-secondary text-white py-4 rounded-xl font-bold shadow-[0_8px_20px_-8px_rgba(254,106,52,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(254,106,52,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center overflow-hidden relative"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
            
            <p className="text-[11px] text-center text-on-surface-variant/70 mt-4 leading-relaxed max-w-[90%] mx-auto">
              Dengan mendaftar, Anda menyetujui <a href="#" className="font-semibold text-primary hover:underline">Syarat & Ketentuan</a> serta <a href="#" className="font-semibold text-primary hover:underline">Kebijakan Privasi</a> SEAPEDIA.
            </p>
          </form>
        </div>
      </div>

      {/* 
        ========================================================================
        BAGIAN KANAN: BRANDING & ILUSTRASI (Hanya terlihat di Desktop)
        Membantu memperindah tampilan pada layar yang lebih lebar.
        ========================================================================
      */}
      <div className="w-full md:w-1/2 lg:w-5/12 relative hidden md:flex flex-col items-center justify-center p-12 overflow-hidden order-1 md:order-2">
        {/* Dynamic Coral/Warm Mesh Gradient Background */}
        <div className="absolute inset-0 bg-[#3A0C00]">
          <div className="absolute top-0 right-0 w-[120%] h-[120%] bg-[radial-gradient(circle_at_100%_0%,_#fe6a34_0%,_transparent_60%)] opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-[100%] h-[100%] bg-[radial-gradient(circle_at_0%_100%,_#ab3500_0%,_transparent_60%)] opacity-80"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#ffb59d_0%,_transparent_50%)] opacity-20"></div>
        </div>
        
        {/* Abstract floating shapes */}
        <div className="absolute top-1/4 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 -left-10 w-60 h-60 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

        {/* Konten Utama Teks pada Bagian Kanan */}
        <div className="z-10 w-full max-w-[384px]">

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Mulai <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-fixed to-white">
              Perjalanan Anda
            </span>
          </h1>
          <p className="text-white/80 text-lg leading-relaxed font-medium mb-12">
            Gabung dengan jutaan pengguna lainnya dan nikmati pengalaman berbelanja tanpa batas.
          </p>

          {/* Feature List */}
          <div className="space-y-5 relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-white/30 via-white/10 to-transparent"></div>
            
            <div className="flex gap-4 relative z-10 items-start">
              <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-white text-[14px]">done</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Gratis Ongkir</h4>
                <p className="text-white/60 text-xs mt-0.5">Nikmati pengiriman tanpa biaya ke seluruh Indonesia.</p>
              </div>
            </div>

            <div className="flex gap-4 relative z-10 items-start">
              <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-white text-[14px]">store</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Buka Toko Gratis</h4>
                <p className="text-white/60 text-xs mt-0.5">Mulai bisnis Anda tanpa biaya pendaftaran.</p>
              </div>
            </div>

            <div className="flex gap-4 relative z-10 items-start">
              <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-white text-[14px]">local_shipping</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Peluang Driver</h4>
                <p className="text-white/60 text-xs mt-0.5">Dapatkan penghasilan tambahan dengan menjadi kurir.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

