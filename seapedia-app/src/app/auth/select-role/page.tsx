'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function SelectRolePage() {
  const router = useRouter()
  const { user, setActiveRole, logout } = useAuthStore()
  const toast = useToast()
  const [mounted, setMounted] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!mounted || !user) return null

  const roleConfig: Record<string, { icon: string; label: string; desc: string; color: string; bg: string; shadow: string; gradient: string }> = {
    BUYER: {
      icon: 'shopping_cart',
      label: 'Pembeli',
      desc: 'Mulai belanja dari ribuan toko di SEAPEDIA',
      color: 'text-[#fe6a34]',
      bg: 'bg-[#ffdbd0]/50',
      shadow: 'hover:shadow-[#fe6a34]/20',
      gradient: 'from-[#fe6a34]/10 to-transparent'
    },
    SELLER: {
      icon: 'storefront',
      label: 'Penjual',
      desc: 'Kelola toko, produk, dan pesanan pelanggan Anda',
      color: 'text-[#005baf]',
      bg: 'bg-[#d5e3ff]/50',
      shadow: 'hover:shadow-[#005baf]/20',
      gradient: 'from-[#005baf]/10 to-transparent'
    },
    DRIVER: {
      icon: 'local_shipping',
      label: 'Driver',
      desc: 'Ambil pesanan dan antar ke pelanggan',
      color: 'text-[#006859]',
      bg: 'bg-[#68fadd]/30',
      shadow: 'hover:shadow-[#006859]/20',
      gradient: 'from-[#006859]/10 to-transparent'
    },
    ADMIN: {
      icon: 'admin_panel_settings',
      label: 'Admin',
      desc: 'God-Eye Monitoring system SEAPEDIA',
      color: 'text-[#7e22ce]',
      bg: 'bg-[#f3e8ff]',
      shadow: 'hover:shadow-[#7e22ce]/20',
      gradient: 'from-[#7e22ce]/10 to-transparent'
    },
  }

  const handleSelectRole = (role: string) => {
    setIsSelecting(true)
    setActiveRole(role)
    toast.success(`Berhasil masuk sebagai ${roleConfig[role].label}`)
    
    // Redirect based on role
    setTimeout(() => {
      switch(role) {
        case 'BUYER': router.push('/buyer'); break;
        case 'SELLER': router.push('/seller/dashboard'); break;
        case 'DRIVER': router.push('/driver/dashboard'); break;
        case 'ADMIN': router.push('/admin/dashboard'); break;
        default: router.push('/');
      }
    }, 500)
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-surface-container-lowest selection:bg-primary/20">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-coral/5 blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="z-10 w-full max-w-5xl">
        <div className="text-center mb-16 animate-slide-down">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="text-4xl md:text-5xl font-black tracking-tight logo-gradient">SEAPEDIA</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface mb-4 tracking-tight">Pilih Peran Anda</h2>
          <p className="text-on-surface-variant max-w-[512px] mx-auto text-base md:text-lg">
            Hai <span className="font-bold text-on-surface">{user.name}</span>! Akun Anda terdaftar dengan beberapa peran. Silakan pilih ruang kerja Anda untuk sesi ini.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {user.roles.map((role, idx) => {
            const config = roleConfig[role] || roleConfig['BUYER']
            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                disabled={isSelecting}
                className={`relative group bg-white border border-outline-variant/50 rounded-3xl p-8 text-left transition-all duration-500 overflow-hidden ${config.shadow} hover:shadow-2xl hover:-translate-y-2 hover:border-transparent disabled:opacity-50 disabled:cursor-wait`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Background Hover Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm border border-white/50 backdrop-blur-sm`}>
                    <span className={`material-symbols-outlined text-[32px] ${config.color}`}>
                      {config.icon}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-on-surface group-hover:text-black transition-colors">{config.label}</h3>
                  <p className="text-sm text-on-surface-variant/80 leading-relaxed font-medium mb-8">
                    {config.desc}
                  </p>
                  
                  <div className={`mt-auto inline-flex items-center gap-2 font-bold text-sm ${config.color} opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}>
                    Masuk Sekarang
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-16 text-center animate-fade-in relative z-10" style={{ animationDelay: '800ms' }}>
          <button 
            onClick={() => {
              logout()
              router.push('/auth/login')
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-on-surface-variant font-semibold hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Keluar / Ganti Akun
          </button>
        </div>
      </div>
    </div>
  )
}

