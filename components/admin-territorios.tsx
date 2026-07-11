"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { useAuth } from "@/lib/auth-context"
import { Plus, Search, Pencil, Trash2, X, Power } from "lucide-react"
import { COLOMBIA_DIVIPOLA } from "@/lib/colombia"

interface Territorio {
  id: string
  codigo: string
  nombre: string
  descripcion?: string | null
  whatsappLink?: string | null
  activo?: boolean
  departamento?: string | null
  municipio?: string | null
}

export function AdminTerritorios() {
  const { user, isSuperAdmin, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingTerritorio, setEditingTerritorio] = useState<Territorio | null>(null)

  const { data: rawTerritorios, mutate } = useSWR<any>("/api/territorios", fetcher)
  const territorios: Territorio[] = Array.isArray(rawTerritorios) ? rawTerritorios : []

  const filtered = useMemo(() => {
    return territorios
      .filter(
        (t) =>
          !search ||
          t.nombre.toLowerCase().includes(search.toLowerCase()) ||
          t.codigo.toLowerCase().includes(search.toLowerCase()) ||
          (t.descripcion && t.descripcion.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
  }, [territorios, search])

  const handleEdit = (t: Territorio) => {
    setEditingTerritorio(t)
    setShowForm(true)
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar el equipo "${nombre}"? Esta acción no se puede deshacer si no contiene dependencias.`)) return
    
    try {
      const res = await fetch(`/api/territorios/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al eliminar")
      }
      mutate()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleToggleStatus = async (t: Territorio) => {
    const accion = t.activo === false ? "habilitar" : "deshabilitar"
    if (!confirm(`¿Seguro que quieres ${accion} este equipo?`)) return

    try {
      const res = await fetch(`/api/territorios/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: t.activo === false ? true : false }),
      })
      if (!res.ok) throw new Error("Error al cambiar de estado")
      mutate()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTerritorio(null)
  }

  const handleSave = async (data: any) => {
    try {
      let res
      if (editingTerritorio) {
        res = await fetch(`/api/territorios/${editingTerritorio.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } else {
        res = await fetch("/api/territorios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al guardar")
      }
      mutate()
      handleFormClose()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Administre los equipos del sistema
            <span className="text-muted-foreground/50 text-xs">|</span>
            <span className="text-xs text-primary/80 font-medium">
              {territorios.filter(t => t.activo !== false).length} activos
            </span>
            <span className="text-muted-foreground/50 text-xs">-</span>
            <span className="text-xs text-destructive/80 font-medium">
              {territorios.filter(t => t.activo === false).length} inactivos
            </span>
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear equipo
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ubicación</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Descripción</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Enlace WhatsApp</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No se encontraron equipos.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${t.activo === false ? 'opacity-50 bg-muted/20' : ''}`}>
                    <td className="px-4 py-3 font-medium">{t.codigo}</td>
                    <td className="px-4 py-3">{t.nombre}</td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {t.departamento ? `${t.departamento.toUpperCase()} - ${t.municipio?.toUpperCase()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.descripcion || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.whatsappLink ? (
                        <a href={t.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline text-xs">
                          Abrir WhatsApp
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSuperAdmin && (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleEdit(t)}
                            className="text-primary/70 hover:text-primary transition-colors"
                            title="Editar equipo"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={`${t.activo === false ? 'text-muted-foreground' : 'text-green-600'} hover:opacity-80 transition-opacity`}
                            title={t.activo === false ? "Habilitar equipo" : "Deshabilitar equipo"}
                          >
                            <Power className="h-4 w-4" />
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(t.id, t.nombre)}
                              className="text-destructive/70 hover:text-destructive transition-colors"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <TerritorioFormModal
          territorio={editingTerritorio}
          onClose={handleFormClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function TerritorioFormModal({ territorio, onClose, onSave }: any) {
  const [codigo, setCodigo] = useState(territorio?.codigo || "")
  const [nombre, setNombre] = useState(territorio?.nombre || "")
  const [descripcion, setDescripcion] = useState(territorio?.descripcion || "")
  const [whatsappLink, setWhatsappLink] = useState(territorio?.whatsappLink || "")
  const [departamento, setDepartamento] = useState(territorio?.departamento || "")
  const [municipio, setMunicipio] = useState(territorio?.municipio || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const municipiosDisponibles = useMemo(() => {
    if (!departamento) return []
    const found = COLOMBIA_DIVIPOLA.find(x => x.departamento.toUpperCase() === departamento.toUpperCase())
    return found ? found.municipios : []
  }, [departamento])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    await onSave({
      codigo,
      nombre,
      descripcion,
      whatsappLink,
      departamento,
      municipio
    })
    setIsSubmitting(false)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200 overflow-y-auto w-full h-full"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 block overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-foreground mb-6">
          {territorio ? "Editar Equipo" : "Crear Equipo"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              Código de Equipo <span className="text-destructive">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="Ej. E01"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all uppercase"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              Nombre descriptivo <span className="text-destructive">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="Ej. EQUIPO NORTE 01"
              value={nombre}
              onChange={(e) => setNombre(e.target.value.toUpperCase())}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all uppercase"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              Departamento
            </label>
            <input
              type="text"
              list="depts-list"
              placeholder="Ej. CHOCO"
              value={departamento}
              onChange={(e) => {
                setDepartamento(e.target.value.toUpperCase())
                setMunicipio("")
              }}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all uppercase"
            />
            <datalist id="depts-list">
              {COLOMBIA_DIVIPOLA.map((d) => (
                <option key={d.departamento} value={d.departamento.toUpperCase()} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              Municipio
            </label>
            <input
              type="text"
              list="munis-list"
              placeholder="Ej. QUIBDO"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value.toUpperCase())}
              disabled={!departamento}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all uppercase disabled:opacity-50"
            />
            <datalist id="munis-list">
              {municipiosDisponibles.map((m) => (
                <option key={m} value={m.toUpperCase()} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Descripción (Opcional)</label>
            <textarea
              rows={3}
              placeholder="Notas u observaciones sobre la zona..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Enlace Grupo de WhatsApp (Opcional)</label>
            <input
              type="url"
              placeholder="Ej. https://chat.whatsapp.com/..."
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !codigo || !nombre}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : territorio ? "Guardar cambios" : "Crear equipo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
