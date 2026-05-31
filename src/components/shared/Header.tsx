'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Role } from '@/types'

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/pacientes': 'Pacientes',
    '/agenda': 'Agenda',
    '/historias': 'Historias Clínicas',
    '/historias/laboral': 'Historia Laboral',
    '/historias/estetica': 'Historia Estética',
    '/historias/cardiovascular': 'Historia Cardiovascular',
    '/reportes': 'Reportes',
    '/configuracion': 'Configuración',
  }

  // Check for exact match first
  if (routes[pathname]) return routes[pathname]

  // Check for prefixes
  for (const [route, title] of Object.entries(routes)) {
    if (pathname.startsWith(route) && route !== '/') {
      // Special cases
      if (pathname.includes('/nuevo') || pathname.includes('/nueva')) {
        return `Nuevo — ${title}`
      }
      if (pathname.split('/').length > route.split('/').length) {
        return title
      }
      return title
    }
  }

  return 'MEDI ONE'
}

function getRoleBadgeVariant(role: Role): 'default' | 'secondary' | 'success' {
  const variants: Record<Role, 'default' | 'secondary' | 'success'> = {
    ADMINISTRADOR: 'default',
    MEDICO: 'success',
    RECEPCIONISTA: 'secondary',
  }
  return variants[role]
}

function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    MEDICO: 'Médico',
    RECEPCIONISTA: 'Recepcionista',
    ADMINISTRADOR: 'Administrador',
  }
  return labels[role]
}

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const userRole = session?.user?.role as Role | undefined

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Page title */}
      <h2 className="font-display text-xl font-semibold text-content">{pageTitle}</h2>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative p-2 rounded-xl text-content-muted hover:bg-bg-surface hover:text-content transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-content leading-none">
              {session?.user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-content-muted mt-0.5">
              {session?.user?.email || ''}
            </p>
          </div>
          {userRole && (
            <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
              {getRoleLabel(userRole)}
            </Badge>
          )}
        </div>
      </div>
    </header>
  )
}
