'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, activeRole } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/auth/login')
    } else if (activeRole !== 'BUYER') {
      router.push('/')
    }
  }, [user, activeRole, router])

  if (!mounted || !user || activeRole !== 'BUYER') return null

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-20 md:pb-0">
      <Navbar />
      <main className="flex-grow container-app py-6 md:py-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
