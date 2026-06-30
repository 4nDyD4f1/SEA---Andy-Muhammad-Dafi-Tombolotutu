'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">Token Tidak Valid</h3>
        <p className="text-on-surface-variant text-sm mb-6">Tautan reset password tidak valid atau tidak ditemukan.</p>
        <Link href="/auth/forgot-password" className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-colors">
          Minta Ulang Tautan
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Gagal terhubung ke server')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xl text-center animate-slide-up">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h3 className="text-2xl font-bold text-on-surface mb-3">Password Berhasil Diubah!</h3>
        <p className="text-on-surface-variant text-sm mb-8">
          Akun Anda telah diamankan kembali. Silakan login menggunakan password baru Anda.
        </p>
        <Link href="/auth/login" className="inline-block w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-colors">
          Kembali ke Halaman Login
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-primary/5 border border-outline-variant">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error animate-shake">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-1.5 group">
          <label className="text-sm font-semibold text-on-surface group-focus-within:text-primary transition-colors">
            Password Baru
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium tracking-wide"
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="space-y-1.5 group">
          <label className="text-sm font-semibold text-on-surface group-focus-within:text-primary transition-colors">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium tracking-wide"
              placeholder="Ketik ulang password"
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
          disabled={isLoading || !password || !confirmPassword}
          className="w-full bg-primary hover:bg-primary-container text-white py-4 rounded-xl font-bold shadow-[0_8px_20px_-8px_rgba(0,91,175,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Simpan Password Baru'
          )}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-surface-container-lowest overflow-hidden selection:bg-primary/20">
      <div className="z-10 w-full max-w-[448px] animate-slide-up">
        
        {/* Header & Logo */}
        <div className="flex flex-col items-center mb-8">

          <h2 className="text-3xl font-bold text-on-surface mb-3 tracking-tight">Buat Sandi Baru 🔑</h2>
          <p className="text-on-surface-variant text-center px-4">
            Pastikan Anda menggunakan kata sandi yang kuat dan mudah diingat.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center bg-white rounded-3xl shadow-xl">Memuat...</div>}>
          <ResetPasswordForm />
        </Suspense>
        
      </div>
    </div>
  )
}
