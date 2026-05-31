'use client'

import { SessionProvider } from 'next-auth/react'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import type { Session } from 'next-auth'

export function DashboardLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
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
