"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { TERRITORIOS } from "@/lib/constants"
import {
  ClipboardList,
  Users,
  Activity,
  Calendar,
  TrendingUp,
  Trophy,
  Database,
  CheckCircle2,
  MapPin,
  Stethoscope,
  Baby,
  HeartPulse,
  Home,
  ShieldAlert,
  AlertTriangle,
  Heart,
  Briefcase,
  Layers,
  Accessibility,
  Clock,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

export function DashboardHome() {
  const { user, isAdmin, isFacturador } = useAuth()
  const userRol = user?.rol?.toLowerCase() || ""
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);
  // Helper para convertir fechas a fecha local consistente
  const getLocalDateString = (d: Date | string) => {
    if (!d) return "";
    const date = new Date(d);
    // Remove the timezone offset shift to just use local JS Date mapping
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString(new Date());

  // Helper para tiempo relativo
  const getRelativeTime = (isoString?: string, defaultDateStr?: string) => {
    if (!isoString && !defaultDateStr) return "hace poco";
    
    // Si no hay timestamp ISO, usamos la fecha default pero es menos preciso
    const date = isoString ? new Date(isoString) : new Date(defaultDateStr + "T00:00:00");
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "hace unos segundos";
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "hace 1 día";
    if (diffDays < 30) return `hace ${diffDays} días`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "hace 1 mes";
    return `hace ${diffMonths} meses`;
  };

  const TOP_N_PROFESIONALES = 10;

  const swrOptions = {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 120000 // 2 minutos sin volver a saturar el backend
  };

  const { data: atencionesData, error: errAt } = useSWR(user ? "/api/atenciones" : null, fetcher, swrOptions)
  const { data: usuariosData, error: errUs } = useSWR(user && isAdmin ? "/api/users" : null, fetcher, swrOptions)
  const { data: programasData, error: errPr } = useSWR(user ? "/api/programas" : null, fetcher, swrOptions)
  const { data: stageData, error: errSt } = useSWR(user ? "/api/settings/stage" : null, fetcher, swrOptions)
  const { data: topProfsData } = useSWR(user ? "/api/atenciones/top-profesionales" : null, fetcher, swrOptions)
  const { data: derivPendientesData } = useSWR(user ? "/api/derivaciones/pendientes" : null, fetcher, swrOptions)
  
  const programas = useMemo(() => Array.isArray(programasData) ? programasData : [], [programasData])
  
  const isEnfermeraJefe = useMemo(() => {
    if (!user || user.rol?.toLowerCase() !== 'profesional') return false;
    const prog = programas.find((p: any) => p.id === user.programaId);
    return prog ? prog.nombre.toLowerCase().includes('enfermer') : false;
  }, [user, programas]);
  
  const shouldFetchIdData = user?.rol?.toLowerCase() === "auxiliar" || isAdmin || isEnfermeraJefe || isFacturador;

  const tIds = (isFacturador && user?.territorioIds?.length) 
    ? user.territorioIds.join(',') 
    : (user?.territorioId || "")

  const { data: identificacionesData, error: errId } = useSWR(
    shouldFetchIdData ? `/api/identificaciones?role=${user?.rol}&territorioId=${tIds}` : null,
    fetcher,
    swrOptions
  )
  const { data: terrsData, error: errTerr } = useSWR("/api/territorios", fetcher, swrOptions)
  const { data: idStats } = useSWR(
    shouldFetchIdData ? `/api/identificaciones/stats?role=${user?.rol}&territorioId=${tIds}&filterMode=todo` : null,
    fetcher,
    swrOptions
  )

  const loading = !atencionesData || (isAdmin && !usuariosData) || !programasData || !stageData || !terrsData || (shouldFetchIdData && (!identificacionesData || !idStats))
  
  const atenciones = useMemo(() => Array.isArray(atencionesData) ? atencionesData : [], [atencionesData])
  const indentificaciones = useMemo(() => Array.isArray(identificacionesData) ? identificacionesData : [], [identificacionesData])
  const usuarios = useMemo(() => Array.isArray(usuariosData) ? usuariosData : [], [usuariosData])
  const terrs = useMemo(() => Array.isArray(terrsData) ? terrsData : [], [terrsData])
  const currentStageStart = useMemo(() => stageData?.currentStageStart || null, [stageData])

  // Territorio del usuario actual (Profesional o Auxiliar)
  const userTerritory = useMemo(() => {
    if (!user?.territorioId) return null;
    const fromApi = terrs.find((t: any) => t.id === user.territorioId);
    if (fromApi) return { label: fromApi.nombre, id: fromApi.codigo };
    return TERRITORIOS.find(t => t.id === user.territorioId);
  }, [user, terrs]);

  // Filtrado Etapa (Atenciones)
  const filteredAtenciones = useMemo(() => {
    if (!currentStageStart) return atenciones;
    return atenciones.filter((a: any) => new Date(a.createdAtISO || (a.fecha + "T00:00:00")) >= new Date(currentStageStart));
  }, [atenciones, currentStageStart]);

  const todayAtenciones = useMemo(() => filteredAtenciones.filter((a: any) => getLocalDateString(a.createdAtISO || a.fecha) === today), [filteredAtenciones, today])
  const misAtenciones = useMemo(() => filteredAtenciones.filter((a: any) => a.profesionalId === user?.id), [filteredAtenciones, user])
  
  const profesionalesActivos = useMemo(() => usuarios.filter((u: any) => u.rol?.toLowerCase() === "profesional" && u.activo !== false).length, [usuarios])
  const auxiliaresActivos = useMemo(() => usuarios.filter((u: any) => u.rol?.toLowerCase() === "auxiliar" && u.activo !== false).length, [usuarios])

  const getProgramaById = (id: string) => programas.find((p: any) => p.id === id)

  // Datos para chart: Atenciones por programa globales
  const chartDataAtenciones = useMemo(() => {
    return programas.map((p: any) => ({
      nombre: p.nombre.length > 12 ? p.nombre.slice(0, 12) + "..." : p.nombre,
      atenciones: filteredAtenciones.filter((a: any) => a.programaId === p.id).length,
    })).filter((d: any) => d.atenciones > 0)
  }, [programas, filteredAtenciones])

  // Datos para chart: Identificaciones por territorio globales (Admin)
  const chartDataIdentificacionesRoles = useMemo(() => {
    const map: Record<string, number> = {};
    indentificaciones.forEach((idf: any) => {
      const terrName = idf.territorio || idf.territorioCodigo || "Sin asignar";
      map[terrName] = (map[terrName] || 0) + 1;
    });
    return Object.keys(map).map(terr => ({
      nombre: terr,
      identificaciones: map[terr]
    })).sort((a: any, b: any) => b.identificaciones - a.identificaciones);
  }, [indentificaciones]);

  const chartDataFacturacion = useMemo(() => {
    const map: Record<string, number> = {
      "PENDIENTE": 0,
      "FACTURADA": 0,
      "DEVUELTA": 0,
      "GLOSADA": 0,
      "NO_FACTURABLE": 0
    };
    filteredAtenciones.forEach((a: any) => {
      const state = a.estadoFacturacion === "EVOLUCIONADA_SAFIX" ? "FACTURADA" : (a.estadoFacturacion || "PENDIENTE");
      if (map[state] !== undefined) {
        map[state]++;
      }
    });

    const labels: Record<string, string> = {
      "PENDIENTE": "Pendientes",
      "FACTURADA": "Facturadas",
      "DEVUELTA": "Devueltas",
      "GLOSADA": "Glosadas",
      "NO_FACTURABLE": "No Facturables"
    }

    return Object.keys(map).map(key => ({
      name: labels[key] || key,
      value: map[key]
    })).filter(d => d.value > 0);
  }, [filteredAtenciones]);

  const recentPendingAtenciones = useMemo(() => {
    return filteredAtenciones
      .filter((a: any) => a.estadoFacturacion === "PENDIENTE")
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAtISO || a.fecha).getTime();
        const dateB = new Date(b.createdAtISO || b.fecha).getTime();
        return dateB - dateA;
      })
      .slice(0, 6)
  }, [filteredAtenciones]);

  // Lógica Auxiliar: Identificaciones del territorio vs personales
  const countsId = useMemo(() => {
    const list = indentificaciones
    return {
      totalTerritorio: list.length,
      misId: list.filter((f: any) => f.encuestador?.documento === user?.documento).length,
      hoyTerritorio: list.filter((f: any) => getLocalDateString(f.fechaDiligenciamiento) === today).length,
      misHoy: list.filter((f: any) => f.encuestador?.documento === user?.documento && getLocalDateString(f.fechaDiligenciamiento) === today).length,
    }
  }, [indentificaciones, user, today])

  const chartDataIdAuxiliar = useMemo(() => {
    const counts: Record<string, number> = {}
    indentificaciones.forEach((f: any) => {
      const estado = f.estadoVisita || "Desconocido"
      counts[estado] = (counts[estado] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      nombre: name === "1" ? "Efectiva" : (name === "2" ? "No Efectiva" : "Negada"),
      cantidad: value
    }))
  }, [indentificaciones])

  // Nuevo gráfico: Productividad diaria (Últimos 14 días)
  const chartDataMisAtencionesDiarias = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = misAtenciones.filter((a: any) => (a.createdAtISO || a.fecha).startsWith(dateStr)).length;
      
      // Formatear fecha para el eje X (ej: "14 Abr")
      const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      data.push({
        nombre: label,
        atenciones: count,
        fechaCompleta: dateStr
      });
    }
    return data;
  }, [misAtenciones])

  const recentIdentificaciones = useMemo(() => {
    return [...indentificaciones].slice(0, 5)
  }, [indentificaciones])

  const recentAtenciones = useMemo(() => {
    if (isAdmin) {
      return [...filteredAtenciones].slice(0, 5)
    } else {
      return filteredAtenciones.filter((a: any) => a.programaId === user?.programaId).slice(0, 5)
    }
  }, [filteredAtenciones, isAdmin, user])

  // Top Profesionales
  const top10Profesionales = useMemo(() => {
    if (Array.isArray(topProfsData) && topProfsData.length > 0) {
      return topProfsData;
    }

    if (!usuarios.length) return [];
    const profs = usuarios.filter((u: any) => u.rol?.toLowerCase() === "profesional" && u.activo !== false);
    
    const counts = profs.map((p: any) => {
      const atencionesProf = filteredAtenciones.filter((a: any) => a.profesionalId === p.id);
      const atencCount = atencionesProf.length;
      const ultimaAtencion = atencionesProf.length > 0 
        ? new Date(atencionesProf[0].createdAtISO || `${atencionesProf[0].fecha}T00:00:00.000Z`).getTime() 
        : 0;

      const prog = getProgramaById(p.programaId);
      return { ...p, atencCount, ultimaAtencion, programaNombre: prog?.nombre || "Sin programa" };
    });
    
    counts.sort((a: any, b: any) => {
      if (b.atencCount !== a.atencCount) return b.atencCount - a.atencCount;
      return 0; 
    });

    return counts.slice(0, TOP_N_PROFESIONALES);
  }, [usuarios, filteredAtenciones, user, programas, topProfsData]);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const misAtencionesMes = useMemo(() => misAtenciones.filter((a: any) => (a.createdAtISO || a.fecha).startsWith(currentMonthStr)), [misAtenciones, currentMonthStr]);

  const getKpis = () => {
    if (userRol === "auxiliar") {
      return [
        {
          label: "Mi Rol",
          value: "Auxiliar",
          icon: <Briefcase className="h-5 w-5" />,
          color: "bg-indigo-100 text-indigo-600",
        },
        {
          label: "Identificaciones (Territorio)",
          value: idStats?.kpis?.totalFichas || 0,
          icon: <MapPin className="h-5 w-5" />,
          color: "bg-primary/10 text-primary",
        },
        {
          label: "Mis identificaciones",
          value: countsId.misId,
          icon: <CheckCircle2 className="h-5 w-5" />,
          color: "bg-chart-2/10 text-chart-2",
        },
        {
          label: "Hoy en Territorio",
          value: countsId.hoyTerritorio,
          icon: <Calendar className="h-5 w-5" />,
          color: "bg-chart-3/10 text-chart-3",
        },
        {
          label: "Mis Registros Hoy",
          value: countsId.misHoy,
          icon: <Activity className="h-5 w-5" />,
          color: "bg-chart-4/10 text-chart-4",
        }
      ]
    }

    if (isEnfermeraJefe) {
      return [
        {
          label: "Identificaciones en Territorio",
          value: idStats?.kpis?.totalFichas || 0,
          icon: <Database className="h-5 w-5" />,
          color: "bg-chart-2/10 text-chart-2",
        },
        {
          label: "Personas Identificadas",
          value: idStats?.kpis?.totalPacientes || 0,
          icon: <Users className="h-5 w-5" />,
          color: "bg-indigo-100 text-indigo-600",
        },
        {
          label: "Mis Atenciones (Total)",
          value: misAtenciones.length,
          icon: <ClipboardList className="h-5 w-5" />,
          color: "bg-primary/10 text-primary",
        },
        {
          label: "Mis Atenc. (Hoy)",
          value: misAtenciones.filter((a: any) => a.fecha.startsWith(today)).length,
          icon: <TrendingUp className="h-5 w-5" />,
          color: "bg-chart-4/10 text-chart-4",
        }
      ]
    }

    if (isFacturador) {
      return [
        {
          label: "Pendientes",
          value: filteredAtenciones.filter((a: any) => a.estadoFacturacion === "PENDIENTE").length,
          icon: <Clock className="h-5 w-5" />,
          color: "bg-yellow-100 text-yellow-600",
        },
        {
          label: "Facturadas",
          value: filteredAtenciones.filter((a: any) => ["FACTURADA", "EVOLUCIONADA_SAFIX"].includes(a.estadoFacturacion)).length,
          icon: <CheckCircle2 className="h-5 w-5" />,
          color: "bg-purple-100 text-purple-600",
        },
        {
          label: "Devueltas/Glosadas",
          value: filteredAtenciones.filter((a: any) => ["DEVUELTA", "GLOSADA"].includes(a.estadoFacturacion)).length,
          icon: <AlertTriangle className="h-5 w-5" />,
          color: "bg-red-100 text-red-600",
        },
        {
          label: "No Facturables",
          value: filteredAtenciones.filter((a: any) => a.estadoFacturacion === "NO_FACTURABLE").length,
          icon: <ShieldAlert className="h-5 w-5" />,
          color: "bg-gray-100 text-gray-600",
        }
      ]
    }

    if (isAdmin) {
      return [
        {
          label: "Total Hogares (Efec.)",
          value: idStats?.kpis?.totalFichas || 0,
          icon: <Home className="h-5 w-5" />,
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "Total Identificados",
          value: idStats?.kpis?.totalPacientes || 0,
          icon: <Users className="h-5 w-5" />,
          color: "bg-indigo-100 text-indigo-600",
        },
        {
          label: "Total Atenciones",
          value: filteredAtenciones.length,
          icon: <ClipboardList className="h-5 w-5" />,
          color: "bg-primary/10 text-primary",
        },
        {
          label: "Seguimientos Familiares",
          value: idStats?.kpis?.seguimientosEtapa || 0,
          icon: <Activity className="h-5 w-5" />,
          color: "bg-rose-100 text-rose-600",
        },
      ]
    }

    return [
      {
        label: "Mi Programa",
        value: programas.find((p: any) => p.id === user?.programaId)?.nombre || "N/A",
        icon: <Briefcase className="h-5 w-5" />,
        color: "bg-indigo-100 text-indigo-600",
      },
      {
        label: "Mis atenciones",
        value: misAtenciones.length,
        icon: <ClipboardList className="h-5 w-5" />,
        color: "bg-primary/10 text-primary",
      },
      {
        label: "Mis atenciones (Mes)",
        value: misAtencionesMes.length,
        icon: <Calendar className="h-5 w-5" />,
        color: "bg-chart-3/10 text-chart-3",
      },
      {
        label: "Mis atenciones (Hoy)",
        value: misAtenciones.filter((a: any) => a.fecha.startsWith(today)).length,
        icon: <TrendingUp className="h-5 w-5" />,
        color: "bg-chart-4/10 text-chart-4",
      },
      {
        label: "Hombres Atendidos",
        value: misAtenciones.filter((a: any) => String(a.pacienteGenero).toUpperCase() === "HOMBRE").length,
        icon: <Users className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-600",
      },
      {
        label: "Mujeres Atendidas",
        value: misAtenciones.filter((a: any) => String(a.pacienteGenero).toUpperCase() === "MUJER").length,
        icon: <Users className="h-5 w-5" />,
        color: "bg-rose-100 text-rose-600",
      },
      {
        label: "Derivaciones Pendien.",
        value: derivPendientesData?.count || 0,
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "bg-yellow-100 text-yellow-600",
      },
      {
        label: "Atenciones Facturadas",
        value: misAtenciones.filter((a: any) => a.estadoFacturacion === "FACTURADA" || a.estadoFacturacion === "EVOLUCIONADA_SAFIX").length,
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: "bg-green-100 text-green-600",
      }
    ]
  }

  const kpis = getKpis()

  if (loading || !isMounted) {
    return (
      <div className="flex w-full items-center justify-center p-8 text-muted-foreground text-sm">
        Cargando panel de resumen...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 overflow-hidden">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hola, {user?.nombre}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userRol === "auxiliar"
              ? "Métricas y datos estadísticos focalizados en tu territorio asignado"
              : isAdmin
              ? "Resumen consolidado global del sistema"
              : isFacturador
              ? "Gestión y monitoreo de facturación de atenciones"
              : "Resumen institucional y personal de gestión de atenciones"}
          </p>
        </div>
        {(userRol === "profesional" || userRol === "auxiliar") && userTerritory && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#097b2c]/10 text-[#097b2c] border border-[#097b2c]/30 rounded-full shadow-sm text-sm font-bold shrink-0 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-500">
            <MapPin className="w-4 h-4" />
            Perteneces al territorio: {userTerritory.label} ({userTerritory.id})
          </div>
        )}
      </div>

      {/* Cards superiores */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hogares */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-500">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-tight mb-1">Hogares</p>
            <p className="text-2xl font-black text-foreground leading-none">{idStats?.kpis?.totalFichas || 0}</p>
          </div>
        </div>

        {/* Personas */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-tight mb-1">Personas</p>
            <p className="text-2xl font-black text-foreground leading-none">{idStats?.kpis?.totalPacientes || 0}</p>
          </div>
        </div>

        {/* Atenciones */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-500">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-tight mb-1">Atenciones</p>
            <p className="text-2xl font-black text-foreground leading-none">{filteredAtenciones.length}</p>
          </div>
        </div>

        {/* Cobertura */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-tight mb-1">Cobertura %</p>
            <p className="text-2xl font-black text-foreground leading-none">
              {idStats?.atencionesKpis?.coberturaAtencion ? `${Number(idStats.atencion || idStats.atencionesKpis.coberturaAtencion).toFixed(1)}%` : "0.0%"}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas Section */}
      <div className="bg-card/50 border border-border p-5 rounded-2xl shadow-sm">
        <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> Alertas Epidemiológicas
        </h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Gestantes */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <Activity className="h-6 w-6 text-rose-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.gestantes || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Gestantes</p>
          </div>
          {/* Menores de 5 */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <Baby className="h-6 w-6 text-teal-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.menores5 || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Menores de 5 años</p>
          </div>
          {/* Adultos mayores */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <Users className="h-6 w-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.mayores60 || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Adultos mayores</p>
          </div>
          {/* Enfermedad aguda */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <HeartPulse className="h-6 w-6 text-red-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.enfermedadAguda || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Enfermedad aguda</p>
          </div>
          {/* Desnutrición */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <Activity className="h-6 w-6 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.signosDesnutricion || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Desnutrición</p>
          </div>
        </div>
      </div>

      {/* Riesgos Section */}
      <div className="bg-card/50 border border-border p-5 rounded-2xl shadow-sm">
        <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-600" /> Factores de Riesgo y Poblaciones
        </h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {/* Discapacidad */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <Accessibility className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.conDiscapacidad || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Discapacidad</p>
          </div>
          {/* Víctimas */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <ShieldAlert className="h-6 w-6 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.victimas || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Víctimas</p>
          </div>
          {/* APGAR alterado */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <Home className="h-6 w-6 text-rose-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.apgarDisfuncion || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">APGAR alterado</p>
          </div>
          {/* Metales pesados */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
            <Activity className="h-6 w-6 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{idStats?.kpis?.riesgoMetales || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Metales pesados</p>
          </div>
        </div>
      </div>

      {/* Gráficas Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Curso de vida */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
          <div className="w-full mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Curso de vida
              </h2>
            </div>
          </div>
          <div className="w-full h-[320px]">
            {(idStats?.piramide?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart layout="vertical" data={idStats?.piramide || []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="oklch(0.9 0.02 285)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 9, fontWeight: 'bold', fill: "var(--foreground)" }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    formatter={((value: any, name: any) => [Math.abs(value), String(name).toLowerCase() === "mujeres" ? "Mujeres" : "Hombres"]) as any}
                  />
                  <Bar dataKey="hombres" name="Hombres" fill="#081e69" stackId="a" radius={[0, 4, 4, 0]} barSize={24} />
                  <Bar dataKey="mujeres" name="Mujeres" fill="#eb3b5a" stackId="a" radius={[4, 0, 0, 4]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground mt-20 text-center text-sm">Sin datos para el curso de vida.</p>
            )}
          </div>
        </div>

        {/* Sexo */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
          <div className="w-full mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Sexo</h2>
          </div>
          <div className="w-full h-[320px] flex items-center justify-center">
            {idStats?.kpis?.totalPacientes ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Hombres", value: idStats?.kpis?.totalHombres || 0 },
                      { name: "Mujeres", value: idStats?.kpis?.totalMujeres || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#081e69" />
                    <Cell fill="#eb3b5a" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center text-sm">Sin datos de sexo.</p>
            )}
          </div>
        </div>

        {/* Atenciones por programa */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Atenciones por programa</h2>
          </div>
          <div className="w-full h-[320px]">
            {chartDataAtenciones.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No hay atenciones registradas.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartDataAtenciones} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 285)" />
                  <XAxis
                    dataKey="nombre"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderRadius: "8px", border: "1px solid var(--border)" }} />
                  <Bar dataKey="atenciones" name="Atenciones" fill="oklch(0.60 0.2 150)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Identificaciones por equipo */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-chart-2" />
            <h2 className="text-lg font-semibold text-foreground">Identificaciones por equipo</h2>
          </div>
          <div className="w-full h-[320px]">
            {chartDataIdentificacionesRoles.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No hay identificaciones registradas.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartDataIdentificacionesRoles} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 285)" />
                  <XAxis
                    dataKey="nombre"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderRadius: "8px", border: "1px solid var(--border)" }} />
                  <Bar dataKey="identificaciones" name="Identificaciones" fill="oklch(0.50 0.18 285)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Gestión Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ranking profesionales */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning fill-chart-4 text-chart-4" />
            <h2 className="text-lg font-semibold text-foreground">Ranking profesionales</h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[360px]">
            {top10Profesionales.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sin registros</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {top10Profesionales.slice(0, 5).map((prof: any, index: number) => (
                    <tr key={prof.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                      <td className="py-2.5 font-bold text-muted-foreground w-8">#{index + 1}</td>
                      <td className="py-2.5">
                        <p className="font-medium text-foreground truncate">{prof.nombre} {prof.apellidos}</p>
                        <p className="text-[10px] text-muted-foreground">{prof.programaNombre}</p>
                      </td>
                      <td className="py-2.5 text-right font-bold text-primary">{prof.atencCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Últimas atenciones */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Últimas atenciones</h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[360px]">
            {recentAtenciones.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sin registros</p>
            ) : (
              <ul className="space-y-3">
                {recentAtenciones.map((a: any) => (
                  <li key={a.id} className="border-b border-border last:border-0 pb-2 last:pb-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.pacienteNombre}</p>
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>{getProgramaById(a.programaId)?.nombre || "Atención"}</span>
                      <span>{getRelativeTime(a.createdAtISO, a.fecha)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Últimas identificaciones */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <Home className="h-5 w-5 text-chart-2" />
            <h2 className="text-lg font-semibold text-foreground">Últimas identificaciones</h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[360px]">
            {recentIdentificaciones.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sin registros</p>
            ) : (
              <ul className="space-y-3">
                {recentIdentificaciones.map((a: any) => (
                  <li key={a.id} className="border-b border-border last:border-0 pb-2 last:pb-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.direccion || "Sin dirección"}</p>
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>{a.territorio || "Territorio"}</span>
                      <span>{getRelativeTime(a.fechaDiligenciamiento)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
