'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const router = useRouter()
  const { user, activeRole, setAuth } = useAuthStore()
  const toast = useToast()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat login')
      }

      setAuth(data.user, data.token)
      toast.success('Login berhasil!')

      const role = data.user.roles[0]
      if (role === 'BUYER') router.push('/buyer')
      else if (role === 'SELLER') router.push('/seller/dashboard')
      else if (role === 'DRIVER') router.push('/driver/dashboard')
      else if (role === 'ADMIN') router.push('/admin/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (role: 'BUYER' | 'SELLER' | 'ADMIN' | 'DRIVER') => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setAuth(data.user, data.token)
      toast.success(`Quick Login sebagai ${role === 'BUYER' ? 'Pembeli' : role === 'SELLER' ? 'Penjual' : role === 'ADMIN' ? 'Admin' : 'Driver'} berhasil!`)
      
      if (role === 'BUYER') router.push('/buyer')
      else if (role === 'SELLER') router.push('/seller/dashboard')
      else if (role === 'DRIVER') router.push('/driver/dashboard')
      else if (role === 'ADMIN') router.push('/admin/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Quick login gagal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white selection:bg-primary/20">
      {/* 
        ========================================================================
        BAGIAN KIRI: BRANDING & ILUSTRASI (Hanya terlihat di Desktop)
        Class 'hidden md:flex' membuat bagian ini hilang di HP dan muncul di layar medium ke atas.
        ========================================================================
      */}
      <div className="w-full md:w-1/2 lg:w-5/12 relative hidden md:flex flex-col items-center justify-center p-12 overflow-hidden">
        
        {/* Latar Belakang Mesh Gradient Dinamis menggunakan radial-gradient */}
        <div className="absolute inset-0 bg-[#001B3C]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,_#005baf_0%,_transparent_50%)] opacity-70"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,_#fe6a34_0%,_transparent_50%)] opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#008471_0%,_transparent_60%)] opacity-30"></div>
        </div>
        
        {/* Ornamen bentuk abstrak melayang dengan efek blur dan animasi pulse (berkedip perlahan) */}
        <div className="absolute top-1/4 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 -right-10 w-60 h-60 bg-coral/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

        {/* Konten Utama Teks pada Bagian Kiri */}
        <div className="z-10 w-full max-w-[384px]">

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Samudra <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-inverse-primary to-white">
              Belanja Terbaik
            </span>
          </h1>
          <p className="text-primary-fixed-dim text-lg leading-relaxed font-medium mb-12">
            Satu ekosistem cerdas untuk pembeli, penjual, dan mitra pengemudi.
          </p>

          {/* Testimonial Glass Card */}
          <div className="glass-dark border border-white/10 rounded-2xl p-6 relative w-full">
            <div className="absolute -top-4 -left-4 text-coral opacity-50">
              <span className="material-symbols-outlined text-5xl">format_quote</span>
            </div>
            <div className="flex text-coral mb-3 gap-1 relative z-10">
              {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-[18px] [font-variation-settings:'FILL'_1]">star</span>)}
            </div>
            <p className="text-white/90 text-sm italic mb-4 relative z-10">
              "Platform paling lengkap! Saya bisa belanja dan pantau pengiriman toko saya sekaligus tanpa ganti aplikasi."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-coral p-[2px]">
                <div className="w-full h-full bg-[#001B3C] rounded-full border-2 border-[#001B3C] overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/initials/svg?seed=Budi" alt="User" />
                </div>
              </div>
              <div>
                <h4 className="text-white text-sm font-bold">Budi Santoso</h4>
                <p className="text-white/50 text-xs">Penjual & Pembeli</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        BAGIAN KANAN: FORMULIR LOGIN
        Area ini memakan sisi kanan di Desktop, atau lebar penuh (100%) di Mobile.
        ========================================================================
      */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-y-auto hide-scrollbar">
        

        <div className="w-full max-w-[448px] animate-slide-up mt-12 md:mt-0">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Kembali ke Beranda
            </Link>
            <h2 className="text-3xl font-bold text-on-surface mb-3 tracking-tight">Selamat Datang 👋</h2>
            <p className="text-on-surface-variant">
              Belum punya akun?{' '}
              <Link href="/auth/register" className="text-primary font-bold hover:text-primary-container transition-colors">
                Buat akun gratis
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5 group">
              <label className="text-sm font-semibold text-on-surface group-focus-within:text-primary transition-colors">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline-variant font-medium"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-on-surface group-focus-within:text-primary transition-colors">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs font-semibold text-primary hover:text-primary-container transition-colors">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline-variant font-medium tracking-wide"
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-primary hover:bg-primary-container text-white py-4 rounded-xl font-bold shadow-[0_8px_20px_-8px_rgba(0,91,175,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(0,91,175,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full hover:animate-[shimmer_1s_forwards]"></div>
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Masuk ke Akun'
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}

