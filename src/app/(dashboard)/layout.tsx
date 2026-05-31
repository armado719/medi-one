'use client'

import { SessionProvider } from 'next-auth/react'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-bg-base">
        <Sidebar />
        <div className="ml-[260px] flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
