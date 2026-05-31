'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Stethoscope,
  ChevronRight,
  Receipt,
  Package,
  ClipboardList,
  ShieldCheck,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Role } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: Role[]
  badge?: 'lowStock'
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/pacientes',
    label: 'Pacientes',
    icon: Users,
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: Calendar,
  },
  {
    href: '/historias',
    label: 'Historias Clínicas',
    icon: FileText,
    roles: ['MEDICO', 'ADMINISTRADOR'],
  },
  {
    href: '/facturacion',
    label: 'Facturación',
    icon: Receipt,
    roles: ['RECEPCIONISTA', 'ADMINISTRADOR'],
  },
  {
    href: '/inventario',
    label: 'Inventario',
    icon: Package,
    roles: ['RECEPCIONISTA', 'ADMINISTRADOR'],
    badge: 'lowStock',
  },
  {
    href: '/documentos/formulas',
    label: 'Fórmulas Médicas',
    icon: ClipboardList,
    roles: ['MEDICO', 'ADMINISTRADOR'],
  },
  {
    href: '/documentos/consentimientos',
    label: 'Consentimientos',
    icon: ShieldCheck,
    roles: ['MEDICO', 'ADMINISTRADOR'],
  },
  {
    href: '/contabilidad',
    label: 'Contabilidad',
    icon: DollarSign,
    roles: ['ADMINISTRADOR'],
  },
  {
    href: '/reportes',
    label: 'Reportes',
    icon: BarChart3,
    roles: ['ADMINISTRADOR'],
  },
  {
    href: '/configuracion',
    label: 'Configuración',
    icon: Settings,
    roles: ['ADMINISTRADOR'],
  },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    MEDICO: 'Médico',
    RECEPCIONISTA: 'Recepcionista',
    ADMINISTRADOR: 'Administrador',
  }
  return labels[role]
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role as Role | undefined
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    if (!userRole || (userRole !== 'RECEPCIONISTA' && userRole !== 'ADMINISTRADOR')) return

    async function fetchLowStock() {
      try {
        const res = await fetch('/api/productos?lowStock=true')
        if (res.ok) {
          const data = await res.json()
          setLowStockCount(data.stats?.lowStockCount ?? 0)
        }
      } catch {
        // silent
      }
    }

    fetchLowStock()
    const interval = setInterval(fetchLowStock, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [userRole])

  // While session loads (userRole undefined) show all items to avoid flash
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || !userRole || item.roles.includes(userRole)
  )

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-white border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-content tracking-wide leading-none">
              MEDI ONE
            </h1>
            <p className="text-xs text-content-muted mt-0.5 font-sans">
              Dra. Alejandra Bárcenas
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const showBadge = item.badge === 'lowStock' && lowStockCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-brand text-white'
                  : 'text-content-muted hover:bg-bg-surface hover:text-content'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  active ? 'text-white' : 'text-content-muted group-hover:text-brand'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {showBadge && !active && (
                <span className="text-[10px] font-semibold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {lowStockCount}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {session?.user?.name ? getInitials(session.user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-content truncate">
              {session?.user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-content-muted">
              {userRole ? getRoleLabel(userRole) : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-muted hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
