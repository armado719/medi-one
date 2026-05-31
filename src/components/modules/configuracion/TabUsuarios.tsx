'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserEntry {
  id: string
  name: string
  email: string
  role: 'MEDICO' | 'RECEPCIONISTA' | 'ADMINISTRADOR'
  active: boolean
  createdAt: string
}

const createSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['MEDICO', 'RECEPCIONISTA', 'ADMINISTRADOR']),
  active: z.boolean().default(true),
})

const editSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6).optional().or(z.literal('')),
  role: z.enum(['MEDICO', 'RECEPCIONISTA', 'ADMINISTRADOR']),
  active: z.boolean(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

const ROLE_LABELS: Record<string, string> = {
  MEDICO: 'Médico',
  RECEPCIONISTA: 'Recepcionista',
  ADMINISTRADOR: 'Administrador',
}

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'success'> = {
  MEDICO: 'default',
  RECEPCIONISTA: 'secondary',
  ADMINISTRADOR: 'success',
}

export function TabUsuarios() {
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editingUser, setEditingUser] = useState<UserEntry | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'RECEPCIONISTA', active: true },
  })

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracion/usuarios')
      if (res.ok) setUsers(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openCreate = () => {
    createForm.reset({ role: 'RECEPCIONISTA', active: true, name: '', email: '', password: '' })
    setDialogMode('create')
  }

  const openEdit = (user: UserEntry) => {
    setEditingUser(user)
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      password: '',
    })
    setDialogMode('edit')
  }

  const handleCreate = async (data: CreateForm) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/configuracion/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear usuario')
      }
      toast.success('Usuario creado correctamente')
      setDialogMode(null)
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (data: EditForm) => {
    if (!editingUser) return
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
        active: data.active,
      }
      if (data.password && data.password.length > 0) body.password = data.password

      const res = await fetch(`/api/configuracion/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Error al actualizar usuario')
      toast.success('Usuario actualizado')
      setDialogMode(null)
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (user: UserEntry) => {
    try {
      const res = await fetch(`/api/configuracion/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Usuario ${!user.active ? 'activado' : 'desactivado'}`)
      fetchUsers()
    } catch {
      toast.error('Error al cambiar estado del usuario')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Usuarios del sistema</CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Nuevo usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-content-muted text-center py-8">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-content-muted text-center py-8">No hay usuarios</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    user.active ? 'border-border bg-bg-surface' : 'border-border/50 bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${user.active ? 'text-content' : 'text-content-muted'}`}>
                      {user.name}
                    </p>
                    <p className="text-xs text-content-muted">{user.email}</p>
                  </div>
                  <Badge variant={ROLE_VARIANT[user.role] ?? 'secondary'}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.active}
                      onCheckedChange={() => handleToggleActive(user)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(user)}
                      title="Editar usuario"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={dialogMode === 'create'} onOpenChange={(v) => { if (!v) setDialogMode(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nombre completo *</Label>
              <Input {...createForm.register('name')} />
              {createForm.formState.errors.name && (
                <p className="text-xs text-red-600">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" {...createForm.register('email')} />
              {createForm.formState.errors.email && (
                <p className="text-xs text-red-600">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Contraseña *</Label>
              <Input type="password" {...createForm.register('password')} />
              {createForm.formState.errors.password && (
                <p className="text-xs text-red-600">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Rol *</Label>
              <Select
                onValueChange={(v) =>
                  createForm.setValue('role', v as 'MEDICO' | 'RECEPCIONISTA' | 'ADMINISTRADOR')
                }
                defaultValue="RECEPCIONISTA"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                  <SelectItem value="MEDICO">Médico</SelectItem>
                  <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogMode(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={dialogMode === 'edit'} onOpenChange={(v) => { if (!v) setDialogMode(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nombre completo *</Label>
              <Input {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-xs text-red-600">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" {...editForm.register('email')} />
            </div>
            <div className="space-y-1">
              <Label>Nueva contraseña (dejar vacío para no cambiar)</Label>
              <Input type="password" {...editForm.register('password')} />
            </div>
            <div className="space-y-1">
              <Label>Rol *</Label>
              <Select
                onValueChange={(v) =>
                  editForm.setValue('role', v as 'MEDICO' | 'RECEPCIONISTA' | 'ADMINISTRADOR')
                }
                value={editForm.watch('role')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                  <SelectItem value="MEDICO">Médico</SelectItem>
                  <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.watch('active')}
                onCheckedChange={(v) => editForm.setValue('active', v)}
              />
              <Label>Usuario activo</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogMode(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
