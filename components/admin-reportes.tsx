"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { fetcher } from "@/lib/fetcher"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { 
  TrendingUp, 
  Target, 
  Users, 
  AlertTriangle, 
  RefreshCcw, 
  FileText, 
  Activity, 
  Map, 
  ShieldAlert, 
  Baby, 
  Accessibility, 
  HeartPulse,
  Heart,
  Briefcase,
  Layers,
  Home,
  Stethoscope,
  ClipboardList,
  Calendar
} from "lucide-react"
import { CONFIG } from "@/lib/config"

const COLORS = [
  "oklch(0.50 0.18 285)",
  "oklch(0.60 0.15 200)",
  "oklch(0.55 0.20 150)",
  "oklch(0.70 0.15 60)",
  "oklch(0.65 0.18 330)",
  "oklch(0.55 0.12 250)",
  "oklch(0.60 0.18 30)",
  "oklch(0.50 0.15 170)",
  "oklch(0.65 0.14 100)",
]

export function AdminReportes() {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, [])

  const [activeTab, setActiveTab] = useState<"atenciones" | "identificaciones">("atenciones")
  const [filterMode, setFilterMode] = useState<"etapa" | "fechas" | "todo">("etapa")
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().slice(0, 10), 
    end: new Date().toISOString().slice(0, 10) 
  })

  const { data: rawAtenciones, isLoading: loadingAtenciones } = useSWR<any>("/api/atenciones", fetcher)
  const { data: rawProgramas, isLoading: loadingProgramas } = useSWR<any>("/api/programas", fetcher)
  const { data: rawUsers, isLoading: loadingUsers } = useSWR<any>("/api/users", fetcher)
  const { data: stageSettings, isLoading: loadingStage } = useSWR<any>("/api/settings/stage", fetcher)
  const { data: idStats, isLoading: loadingStats } = useSWR<any>(`/api/identificaciones/stats?filterMode=${filterMode}&startDate=${dateRange.start}&endDate=${dateRange.end}`, fetcher)
  const { data: rawTerritorios, isLoading: loadingTerr } = useSWR<any>("/api/territorios", fetcher)
  
  const atenciones: any[] = Array.isArray(rawAtenciones) ? rawAtenciones : []
  const programas: any[] = Array.isArray(rawProgramas) ? rawProgramas : []
  const users: any[] = Array.isArray(rawUsers) ? rawUsers : []
  const territorios: any[] = Array.isArray(rawTerritorios) ? rawTerritorios : []
  const currentStageStart = stageSettings?.currentStageStart || null
  
  const loading = loadingAtenciones || loadingProgramas || loadingUsers || loadingStage || loadingStats || loadingTerr



  const [isRestarting, setIsRestarting] = useState(false)
  const [showRestartModal, setShowRestartModal] = useState(false)
  const [vistaTablet, setVistaTablet] = useState<"programa" | "profesional">("programa")

  const handleRestartStage = async () => {
    setIsRestarting(true)
    try {
      const res = await fetch("/api/settings/stage", { method: "POST" })
      if (res.ok) {
        setShowRestartModal(false)
        mutate("/api/settings/stage")
        mutate("/api/atenciones")
      } else {
        alert("Hubo un error al reiniciar la etapa")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsRestarting(false)
    }
  }

  const filteredAtenciones = useMemo(() => {
    if (filterMode === "todo") return atenciones
    if (filterMode === "etapa") {
      if (!currentStageStart) return atenciones
      return atenciones.filter(a => new Date(a.createdAtISO || (a.fecha + "T00:00:00")) >= new Date(currentStageStart))
    }
    if (filterMode === "fechas") {
      const start = new Date(dateRange.start + "T00:00:00")
      const end = new Date(dateRange.end + "T23:59:59")
      return atenciones.filter(a => {
        const d = new Date(a.createdAtISO || (a.fecha + "T00:00:00"))
        return d >= start && d <= end
      })
    }
    return atenciones
  }, [atenciones, currentStageStart, filterMode, dateRange])

  const atencionesPerPrograma = useMemo(() => {
    return programas.map((p) => {
      const count = filteredAtenciones.filter((a) => a.programaId === p.id).length
      if (filterMode !== "etapa") return { id: p.id, nombre: p.nombre, atenciones: count, meta: "N/A", porcentaje: "N/A" }
      const profCount = users.filter((u) => u.programaId === p.id && u.rol === "profesional").length
      const metaIndividual = p.meta ?? CONFIG.META_INDIVIDUAL_POR_DEFECTO
      const meta = profCount > 0 ? (profCount * metaIndividual) : metaIndividual
      const porcentaje = meta > 0 ? Math.round((count / meta) * 100) : 0
      return { id: p.id, nombre: p.nombre, atenciones: count, meta, porcentaje }
    }).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [filteredAtenciones, programas, users, filterMode])

  const atencionesPerProfesional = useMemo(() => {
    const profesionales = users.filter((u) => u.rol === "profesional")
    return profesionales.map((prof) => {
      const count = filteredAtenciones.filter((a) => a.profesionalId === prof.id).length
      const programaDelProf = programas.find((p) => p.id === prof.programaId)
      if (filterMode !== "etapa") return { id: prof.id, nombre: `${prof.nombre} ${prof.apellidos}`, programa: programaDelProf?.nombre || "Sin programa", atenciones: count, meta: "N/A", porcentaje: "N/A" }
      const meta = programaDelProf?.meta ?? CONFIG.META_INDIVIDUAL_POR_DEFECTO
      const porcentaje = meta > 0 ? Math.round((count / meta) * 100) : 0
      return { id: prof.id, nombre: `${prof.nombre} ${prof.apellidos}`, programa: programaDelProf?.nombre || "Sin programa", atenciones: count, meta, porcentaje }
    }).sort((a, b) => b.atenciones - a.atenciones)
  }, [filteredAtenciones, users, programas, filterMode])

  const pieAtenciones = useMemo(() => {
    return atencionesPerPrograma.filter((p) => p.atenciones > 0).map((p) => ({ name: p.nombre, value: p.atenciones }))
  }, [atencionesPerPrograma])

  const facturacionStats = useMemo(() => {
    if (!territorios.length || !users.length) return []
    
    return territorios.map(t => {
      const profIds = users.filter((u: any) => u.territorioId === t.id).map((u: any) => u.id)
      const atencionesTerr = filteredAtenciones.filter((a: any) => profIds.includes(a.profesionalId))
      
      const pendientes = atencionesTerr.filter((a: any) => a.estadoFacturacion === "PENDIENTE").length
      const facturadas = atencionesTerr.filter((a: any) => ["FACTURADA", "EVOLUCIONADA_SAFIX", "PAGADA"].includes(a.estadoFacturacion)).length
      const devueltas = atencionesTerr.filter((a: any) => ["DEVUELTA", "GLOSADA", "NO_FACTURABLE"].includes(a.estadoFacturacion)).length
      
      return {
        id: t.id,
        nombre: t.nombre,
        codigo: t.codigo,
        pendientes,
        facturadas,
        devueltas,
        total: atencionesTerr.length
      }
    }).sort((a,b) => b.total - a.total)
  }, [filteredAtenciones, territorios, users])

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 overflow-hidden pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análisis de Gestión Territorial</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo en tiempo real de atenciones, metas e indicadores poblacionales
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {filterMode === "fechas" && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1 shadow-sm">
              <input 
                type="date" 
                className="bg-transparent text-sm font-medium outline-none" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} 
              />
              <span className="text-muted-foreground font-medium">-</span>
              <input 
                type="date" 
                className="bg-transparent text-sm font-medium outline-none" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} 
              />
            </div>
          )}

          <select 
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
          >
            <option value="etapa">Etapa Actual</option>
            <option value="fechas">Período Personalizado</option>
            <option value="todo">Histórico Total</option>
          </select>

          {activeTab === "atenciones" && (
            <button
              onClick={() => setShowRestartModal(true)}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
            >
              <RefreshCcw className="h-4 w-4" />
              Reiniciar Etapa
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("atenciones")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === "atenciones" 
            ? "border-primary text-primary" 
            : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4" />
          Gestión de Atenciones
        </button>
        <button
          onClick={() => setActiveTab("identificaciones")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === "identificaciones" 
            ? "border-primary text-primary" 
            : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Reporte Poblacional (Equipos)
        </button>
      </div>

      {(loading || !isMounted) && (
        <div className="flex w-full items-center justify-center p-20 text-muted-foreground text-sm flex-col gap-4">
          <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
          Procesando grandes volúmenes de datos territoriales...
        </div>
      )}

      {!loading && isMounted && activeTab === "atenciones" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-500">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Total Atenciones</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.atencionesKpis?.totalAtenciones || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Personas Atendidas</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.atencionesKpis?.personasAtendidas || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Cobertura de Atención</p>
                <h3 className="text-xl font-black text-foreground truncate">
                  {(idStats?.atencionesKpis?.coberturaAtencion || 0).toFixed(1)}%
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Programas Activos</p>
                <h3 className="text-xl font-black text-foreground truncate">
                  {atencionesPerPrograma.filter(p => p.atenciones > 0).length || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Profesionales Activos</p>
                <h3 className="text-xl font-black text-foreground truncate">
                  {atencionesPerProfesional.filter(p => p.atenciones > 0).length || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-500">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Equipos c/ Atenciones</p>
                <h3 className="text-xl font-black text-foreground truncate">
                  {facturacionStats.filter(t => t.total > 0).length || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Meses con Registros</p>
                <h3 className="text-xl font-black text-foreground truncate">
                  {idStats?.atencionesKpis?.porMes?.length || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-500">
                <Baby className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Etarios Atendidos</p>
                <h3 className="text-xl font-black text-foreground truncate">
                  {idStats?.atencionesKpis?.porCursoVida?.length || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Personas sin Atención</p>
                <h3 className="text-xl font-black text-destructive truncate">
                  {idStats?.atencionesKpis?.personasSinAtencion || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Remisiones (P/EP/C)</p>
                <h3 className="text-xs font-bold text-foreground truncate">
                  P: {idStats?.atencionesKpis?.remisionesPendientes || 0} | EP: {idStats?.atencionesKpis?.remisionesEnProceso || 0} | C: {idStats?.atencionesKpis?.remisionesCerradas || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Seguimientos Realizados</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.atencionesKpis?.seguimientos || 0}</h3>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bar Chart */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Atenciones por Programa</h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={atencionesPerPrograma} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 285)" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" height={80} interval={0} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)" }} />
                    <Bar dataKey="atenciones" name="Atenciones" fill="oklch(0.50 0.18 285)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Atenciones por Territorio</h2>
              </div>
              <div className="h-80">
                {facturacionStats.filter(t => t.total > 0).length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">Sin registros</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={facturacionStats.filter(t => t.total > 0).slice(0, 10)} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 285)" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" height={80} interval={0} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)" }} />
                      <Bar dataKey="total" name="Atenciones" fill="oklch(0.60 0.15 200)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

        </>
      )}

      {/* REPORTE POBLACIONAL (ID) - NEW MODULE */}
      {!loading && isMounted && activeTab === "identificaciones" && idStats && (
        <div className="flex flex-col gap-6">
          {/* Main Indicators Grid */}
          {/* Main Indicators Grid - 17 KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-500">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Total Hogares</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.totalFichas || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Total Personas</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.totalPacientes || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Pers. por Hogar</p>
                <h3 className="text-xl font-black text-foreground truncate">
                  {(idStats?.kpis?.totalPacientes / (idStats?.kpis?.totalFichas || 1)).toFixed(1)}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 w-full">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Distribución Sexo</p>
                <h3 className="text-xs font-bold text-foreground truncate">
                  H: {idStats?.kpis?.totalHombres || 0} | M: {idStats?.kpis?.totalMujeres || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-500">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0 w-full">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Ciclo Vital</p>
                <h3 className="text-[10px] font-bold text-foreground truncate">
                  {idStats?.piramide?.map((p: any) => `${p.label.split(' ')[0]}: ${p.hombres + p.mujeres}`).join(', ') || 'Sin datos'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Gestantes</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.gestantes || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Adulto Mayor (60+)</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.mayores60 || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-500">
                <Baby className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Menores de 5</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.menores5 || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0 w-full">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Aseguramiento</p>
                <h3 className="text-[10px] font-bold text-foreground truncate">
                  S: {idStats?.kpis?.regimenSubsidiado || 0} | C: {idStats?.kpis?.regimenContributivo || 0} | Sin: {idStats?.kpis?.sinAseguramiento || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0 w-full">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Priorizados</p>
                <h3 className="text-xs font-bold text-foreground truncate">
                  Víct: {idStats?.kpis?.victimas || 0} | PcD: {idStats?.kpis?.conDiscapacidad || 0}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Riesgo Nutricional</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.signosDesnutricion || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-500">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">APGAR Alterado</p>
                <h3 className="text-xl font-black text-destructive truncate">{idStats?.kpis?.apgarDisfuncion || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Riesgo Metales</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.riesgoMetales || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-500">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Enfermedad Aguda</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.enfermedadAguda || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-500">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Hogares Hacinados</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.hacinamiento || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Con Barreras Acceso</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.conBarreras || 0}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Familias c/ Seg.</p>
                <h3 className="text-xl font-black text-foreground truncate">{idStats?.kpis?.seguimientos || 0}</h3>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
             {/* 1. Ciclo de Vida y Genero */}
             {/* 1. Pirámide */}
             <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center">
               <div className="w-full mb-4 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Layers className="h-5 w-5 text-primary" />
                   <h2 className="text-lg font-bold text-foreground">
                     Cursos de Vida y Género
                   </h2>
                 </div>
                 <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#081e69]"></div>
                      <span className="font-bold">HOMBRES: {idStats?.kpis?.totalHombres || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#eb3b5a]"></div>
                      <span className="font-bold">MUJERES: {idStats?.kpis?.totalMujeres || 0}</span>
                    </div>
                 </div>
               </div>
               <div className="w-full h-80">
                 {(idStats?.piramide?.length || 0) > 0 ? (
                   <ResponsiveContainer width="100%" height={320}>
                     <BarChart layout="vertical" data={idStats?.piramide || []} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="oklch(0.9 0.02 285)" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                       <Tooltip
                         cursor={{ fill: 'transparent' }}
                         contentStyle={{ backgroundColor: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                         formatter={((value: any, name: any) => [Math.abs(value), String(name).toLowerCase() === "mujeres" ? "Mujeres" : "Hombres"]) as any}
                       />
                       <Bar dataKey="hombres" name="Hombres" fill="#081e69" stackId="a" radius={[0, 4, 4, 0]} barSize={20} />
                       <Bar dataKey="mujeres" name="Mujeres" fill="#eb3b5a" stackId="a" radius={[4, 0, 0, 4]} barSize={20} />
                     </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <p className="text-muted-foreground mt-20 text-center text-sm">Sin datos para la pirámide poblacional.</p>
                 )}
               </div>
             </div>

             {/* 2. Régimen de Afiliación */}
             <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center">
                <div className="w-full mb-6 flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-500" />
                  <h3 className="text-lg font-bold">Aseguramiento</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={idStats?.aseguramiento?.regimen || []}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                         {idStats?.aseguramiento?.regimen?.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
             {/* 3. Riesgos Prioritarios */}
             <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                  <h3 className="text-lg font-bold text-foreground">Alertas de Salud y Vulnerabilidades</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-100/30 border border-orange-200">
                     <AlertTriangle className="h-10 w-10 text-orange-500" />
                     <div>
                       <span className="text-[10px] font-black text-orange-600 block mb-0.5">ESTADO NUTRICIONAL</span>
                       <p className="text-2xl font-black text-foreground leading-none">{idStats?.kpis?.signosDesnutricion || 0}</p>
                       <p className="text-[10px] text-orange-700 font-medium">Casos con riesgo/signos</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-100/30 border border-rose-200">
                     <ShieldAlert className="h-10 w-10 text-rose-500" />
                     <div>
                       <span className="text-[10px] font-black text-rose-600 block mb-0.5">ENF. HUÉRFANAS</span>
                       <p className="text-2xl font-black text-foreground leading-none">{idStats?.kpis?.hogaresHuerfanas || 0}</p>
                       <p className="text-[10px] text-rose-700 font-medium">Hogares con casos crónicos</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-100/30 border border-blue-200">
                     <Activity className="h-10 w-10 text-blue-500" />
                     <div>
                       <span className="text-[10px] font-black text-blue-600 block mb-0.5">ENF. AGUDA</span>
                       <p className="text-2xl font-black text-foreground leading-none">{idStats?.kpis?.enfermedadAguda || 0}</p>
                       <p className="text-[10px] text-blue-700 font-medium">Casos último mes</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-100/30 border border-indigo-200">
                     <Users className="h-10 w-10 text-indigo-500" />
                     <div>
                       <span className="text-[10px] font-black text-indigo-600 block mb-0.5">VÍCTIMAS</span>
                       <p className="text-2xl font-black text-foreground leading-none">{idStats?.kpis?.victimas || 0}</p>
                       <p className="text-[10px] text-indigo-700 font-medium">Víctimas del conflicto</p>
                     </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                   <h4 className="text-xs font-black uppercase text-muted-foreground mb-4">Ranking de Vulnerabilidades Reportadas</h4>
                   <div className="space-y-3">
                     {idStats?.vulnerabilidades?.slice(0, 5).map((v: any, i: number) => (
                       <div key={v.name} className="flex items-center gap-3">
                         <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold w-6 text-center">{i+1}</span>
                         <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-xs font-bold">{v.name}</span>
                               <span className="text-xs font-black text-primary">{v.value}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${Math.min(100, (v.value / (idStats?.kpis?.totalFichas || 1)) * 300)}%` }}></div>
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
             </div>

             {/* 4. Estrato y Hábitos */}
             <div className="flex flex-col gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1">
                   <div className="flex items-center gap-2 mb-6">
                     <Briefcase className="h-5 w-5 text-indigo-500" />
                     <h3 className="text-lg font-bold">Estrato Socioeconómico</h3>
                   </div>
                   <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={idStats?.estratos || []}>
                           <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                           <XAxis dataKey="name" label={{ value: "Estrato", position: "insideBottom", offset: -5 }} />
                           <YAxis />
                           <Tooltip contentStyle={{ borderRadius: "12px" }} />
                           <Bar dataKey="value" name="Familias" fill="oklch(0.60 0.15 200)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center gap-2 mb-4">
                     <Heart className="h-5 w-5 text-emerald-500" />
                     <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-500">Hábitos Saludables</h3>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex-1">
                         <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400 leading-none">{idStats?.kpis?.habitosSaludables || 0}</p>
                         <p className="text-xs text-emerald-600 font-bold mt-2 uppercase tracking-tighter">Realizan actividad física diaria</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-black/20 rounded-2xl shadow-inner border border-emerald-100">
                         <Activity className="h-12 w-12 text-emerald-500 animate-pulse" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Restart Stage Modal */}
      {showRestartModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto w-full h-full"
          onClick={(e) => { if (e.target === e.currentTarget && !isRestarting) setShowRestartModal(false) }}
        >
          <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="mb-6 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-destructive/10 rounded-full text-destructive"><AlertTriangle className="h-10 w-10" /></div>
              <h2 className="text-2xl font-black text-foreground">¿Reiniciar Estadísticas?</h2>
              <p className="text-muted-foreground text-sm">
                Esta acción marcará el inicio de una nueva etapa. Se archivarán los registros actuales para el histórico y los contadores volverán a cero.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestartStage}
                disabled={isRestarting}
                className="w-full rounded-xl bg-destructive py-3.5 text-sm font-black text-white hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
              >
                {isRestarting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : "SÍ, REINICIAR ETAPA"}
              </button>
              <button
                onClick={() => setShowRestartModal(false)}
                disabled={isRestarting}
                className="w-full rounded-xl border border-border bg-muted/30 py-3.5 text-sm font-bold hover:bg-muted transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
