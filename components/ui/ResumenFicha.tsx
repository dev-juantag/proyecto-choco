import { ArrowLeft, Printer, MapPin, Info, Home, Users, Activity, Stethoscope, FileText, Network, Edit, Phone, Plus, CheckSquare, ClipboardList, Trash2, Lock, Unlock } from 'lucide-react'
import { 
  ESTADO_VISITA, APGAR_OPCIONES, calcularEdad, 
  FUENTE_AGUA, DISPOSICION_EXCRETAS, AGUAS_RESIDUALES, 
  DISPOSICION_RESIDUOS, RIESGO_ACCIDENTE, ANIMALES,
  GRUPO_POBLACIONAL, DISCAPACIDADES, BARRERAS_ACCESO,
  ANTECEDENTES_CRONICOS, ANTECEDENTES_TRANSMISIBLES, PARENTESCO,
  ECOMAPA_OPCIONES, ZARIT_OPCIONES, VULNERABILIDADES, TIPO_VIVIENDA, TIPO_FAMILIA, FUENTE_ENERGIA
} from '@/lib/constants'
import FamiliogramaViewer from './FamiliogramaViewer'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { FamiliogramaGlobalEditor } from '../familiograma-global-editor'
import FamiliogramaStaticViewer from './FamiliogramaStaticViewer'
import { toast } from 'sonner'

export default function ResumenFicha({ 
  ficha, onClose, onStartNew, onEnableUpdate, onGoToEdit, onRefreshFicha 
}: { 
  ficha: any, onClose: () => void, onStartNew?: () => void,
  onEnableUpdate?: (id: string, current: boolean) => void,
  onGoToEdit?: () => void,
  onRefreshFicha?: () => void
}) {
  const [showFamiliograma, setShowFamiliograma] = useState(false)
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)
  const [segObservacion, setSegObservacion] = useState('')
  const [segAcuerdos, setSegAcuerdos] = useState(false)
  const [isSubmittingSeg, setIsSubmittingSeg] = useState(false)
  
  // Nuevos estados para Compromisos
  const [nuevosCompromisos, setNuevosCompromisos] = useState<any[]>([])
  const [compromisosModificados, setCompromisosModificados] = useState<any[]>([])
  const [nuevoCompromisoTexto, setNuevoCompromisoTexto] = useState('')
  const [nuevoCompromisoPaciente, setNuevoCompromisoPaciente] = useState('')
  const [nuevoCompromisoFecha, setNuevoCompromisoFecha] = useState('')
  const [segPage, setSegPage] = useState(1)

  const { user, isSuperAdmin, isAdmin } = useAuth()
  const { data: rawProgramas } = useSWR("/api/programas", fetcher)
  
  const handleDeleteSeguimiento = async (segId: string) => {
    if (!confirm('¿Está seguro de eliminar este seguimiento? Esta acción no se puede deshacer y también eliminará o restaurará los acuerdos relacionados.')) return;
    try {
      const res = await fetch(`/api/identificaciones/${ficha.id}/seguimientos/${segId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gestion-poblacional-token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      toast.success(data.message || 'Seguimiento eliminado');
      if (onRefreshFicha) onRefreshFicha();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!ficha) return null

  const isEnfermeria = () => {
    if (!user || user.rol !== 'profesional' || !user.programaId) return false;
    const prog = Array.isArray(rawProgramas) ? rawProgramas.find((p: any) => String(p.id) === String(user.programaId)) : null;
    return prog ? prog.nombre.toLowerCase().includes('enfermer') : false;
  }

  const isPsicologiaSocial = () => {
    if (!user || user.rol !== 'profesional') return false;
    // Buscamos en programas si existe o podemos inferir desde otra parte
    const prog = Array.isArray(rawProgramas) ? rawProgramas.find((p: any) => String(p.id) === String(user.programaId)) : null;
    if (prog) {
      const n = prog.nombre.toLowerCase();
      return n.includes('psicolog') || n.includes('trabaj') || n.includes('desarrollo familiar');
    }
    return false;
  }

  // Prevenir parpadeo si los programas aún están cargando y sabemos que es profesional
  const isLoadingProgramas = !rawProgramas && user?.rol === 'profesional';
  const canManageFamiliograma = isSuperAdmin || isAdmin || isEnfermeria() || isPsicologiaSocial() || (isLoadingProgramas && user?.rol === 'profesional');

  const fechaText = new Date(ficha.fechaDiligenciamiento).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric'
  })

  const getLabel = (arr: any[], id: any) => arr.find(x => String(x.id) === String(id))?.label || id || 'N/A'

  // Prioridad: 1) usuario real vinculado, 2) datos crudos de importación CSV
  const nombreEncuestador = ficha.encuestador 
    ? `${ficha.encuestador.nombre} ${ficha.encuestador.apellidos}`.trim()
    : (ficha.encuestadorNombreRaw || 'Sin registrar')
  const docEncuestador = ficha.encuestador?.documento 
    || ficha.encuestadorDocRaw 
    || ficha.numDocEncuestador 
    || 'N/A'

  const estadoVisitaLabel = getLabel(ESTADO_VISITA, ficha.estadoVisita)
  
  const codigoTerritorio = ficha.territorioCodigo || ficha.territorio?.codigo || ''

  // Formato visual para IDs garantizando que tengan el código del territorio y hogar para trazabilidad
  let displayNumHogar = ficha.numHogar || '-';
  if (ficha.numHogar && codigoTerritorio && !ficha.numHogar.startsWith(codigoTerritorio)) {
    displayNumHogar = `${codigoTerritorio}${ficha.numHogar.replace(/^H?/, 'H')}`; // Ej: T14 + H2408
  }

  let displayNumFamilia = ficha.numFamilia || '-';
  if (ficha.numFamilia && displayNumHogar !== '-' && !ficha.numFamilia.startsWith(displayNumHogar)) {
    displayNumFamilia = `${displayNumHogar}${ficha.numFamilia.replace(/^F?/, 'F')}`; // Ej: T14H2408 + F0008
  }

  // Paginación de seguimientos
  const segLimit = 5;
  const totalSeguimientos = ficha.seguimientos?.length || 0;
  const totalSegPages = Math.ceil(totalSeguimientos / segLimit) || 1;
  const paginatedSeguimientos = ficha.seguimientos?.slice((segPage - 1) * segLimit, segPage * segLimit) || [];

  const getLabels = (arr: any[], ids: any) => {
    const list = Array.isArray(ids) ? ids : (ids ? [ids] : []);
    if (list.length === 0) return 'Ninguno';
    return list.map((id: any) => getLabel(arr, id)).join(', ');
  }

  const getApgarScoreText = () => {
    let cat = getLabel(APGAR_OPCIONES, ficha.apgar).split(' (')[0];
    if (ficha.apgarRespuestas && Array.isArray(ficha.apgarRespuestas)) {
      const valid = ficha.apgarRespuestas.filter((v: any) => v !== null && v !== undefined);
      if (valid.length > 0) {
        const score = ficha.apgarRespuestas.reduce((a: number, b: number) => a + (b || 0), 0);
        if (score >= 17) cat = 'Normal';
        else if (score >= 13) cat = 'Disfunción leve';
        else if (score >= 10) cat = 'Disfunción moderada';
        else cat = 'Disfunción severa';
      }
    }
    return cat;
  }

  const getEcomapaScoreText = () => {
    let cat = getLabel(ECOMAPA_OPCIONES, ficha.ecomapa).split(' (')[0];
    if (ficha.ecomapaRespuestas && Array.isArray(ficha.ecomapaRespuestas)) {
      const valid = ficha.ecomapaRespuestas.filter((v: any) => v !== null && v !== undefined);
      if (valid.length > 0) {
        const score = ficha.ecomapaRespuestas.reduce((a: number, b: number) => a + (b || 0), 0);
        if (score >= 8) cat = 'Red de apoyo adecuada';
        else if (score >= 5) cat = 'Red de apoyo limitada';
        else cat = 'Red de apoyo insuficiente';
      }
    }
    return cat;
  }

  const getZaritScoreText = () => {
    let cat = getLabel(ZARIT_OPCIONES, ficha.zarit).split(' (')[0];
    if (ficha.zaritRespuestas && Array.isArray(ficha.zaritRespuestas)) {
      const valid = ficha.zaritRespuestas.filter((v: any) => v !== null && v !== undefined);
      if (valid.length > 0) {
        const score = ficha.zaritRespuestas.reduce((a: number, b: number) => a + (b || 0), 0);
        if (score >= 13) cat = 'Sobrecarga intensa';
        else if (score >= 8) cat = 'Sobrecarga leve';
        else cat = 'Sin sobrecarga';
      }
    }
    return cat;
  }

  return (
    <div className="w-full flex flex-col bg-gray-50/50 min-h-[70vh] print:hidden">
      
      {/* Header Modal */}
      <div className="bg-[#081e69] text-white p-6 pb-8 rounded-t-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black">
              Resumen de Identificación <span className="text-blue-300">#{ficha.consecutivo}</span>
            </h1>
            <p className="text-sm text-blue-100 mt-1 opacity-80">
              Capturada el {fechaText}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto md:justify-end">
          {/* 1. Estado de la Visita (Efectiva/No Efectiva/Negada) */}
          <div className={`px-3 py-1.5 rounded-full font-black text-[10px] sm:text-xs tracking-widest border shrink-0 ${
            ficha.estadoVisita === '1' ? 'bg-teal-100 text-teal-800 border-teal-200' :
            ficha.estadoVisita === '2' ? 'bg-orange-100 text-orange-800 border-orange-200' :
            'bg-red-100 text-red-800 border-red-200'
          }`}>
            {estadoVisitaLabel}
          </div>

          {/* 2. Botón de Actualización / Habilitar o Deshabilitar Edición */}
          {ficha.puedeActualizarse ? (
            <div className="flex items-center gap-1.5">
              {(user?.rol === 'auxiliar' || isSuperAdmin) && onGoToEdit && (
                <button
                  onClick={onGoToEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-amber-900 rounded-full font-black text-[11px] sm:text-xs shadow hover:bg-amber-500 transition-colors shrink-0"
                >
                  <Edit className="w-3 h-3" /> Actualizar Ficha
                </button>
              )}
              {isSuperAdmin && onEnableUpdate && (
                <button
                  onClick={() => onEnableUpdate(ficha.id, true)}
                  className="p-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-200 transition-colors shadow-sm shrink-0"
                  title="Deshabilitar Edición"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
              {!isSuperAdmin && (isAdmin || isEnfermeria()) && onEnableUpdate && (
                <button
                  onClick={() => onEnableUpdate(ficha.id, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full font-bold text-[11px] sm:text-xs shadow-sm hover:bg-amber-200 transition-colors shrink-0"
                >
                  <Lock className="w-3 h-3" /> Deshabilitar Edición
                </button>
              )}
            </div>
          ) : (
            (isSuperAdmin || isAdmin || isEnfermeria()) && onEnableUpdate && (
              <button
                onClick={() => onEnableUpdate(ficha.id, false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full font-bold text-[11px] sm:text-xs shadow-sm hover:bg-emerald-600 transition-colors shrink-0"
              >
                <Unlock className="w-3.5 h-3.5" /> Permitir Edición
              </button>
            )
          )}

          {/* 3. Imprimir Ficha */}
          {(user?.rol === 'auxiliar' || isSuperAdmin || isAdmin || isEnfermeria()) && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#081e69] rounded-full font-bold text-[11px] sm:text-xs shadow hover:bg-blue-50 transition-colors shrink-0"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Ficha
            </button>
          )}
        </div>
      </div>

      {/* Body / Tarjetas */}
      <div className="p-6 md:p-8 space-y-6">

        {/* Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Ubicación */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Ubicación y Geografía</h2>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Sección I</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Municipio</p>
                <p className="font-bold text-gray-800 text-sm uppercase">{ficha.municipio}, {ficha.departamento}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Barrio / Poblado / Sector</p>
                <p className="font-bold text-gray-800 text-sm uppercase">{ficha.centroPoblado || 'No registrado'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Dirección</p>
                <p className="font-bold text-gray-800 text-sm">{ficha.direccion}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Descripción de la Ubicación</p>
                <p className="font-bold text-gray-800 text-sm">{ficha.descripcionUbicacion || 'No registrada'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Georreferenciación (Lat, Lng)</p>
                <p className="font-bold text-gray-800 text-sm font-mono">
                  {ficha.latitud && ficha.longitud ? `${Number(ficha.latitud).toFixed(7)}, ${Number(ficha.longitud).toFixed(7)}` : 'Sin registrar'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Institucional */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Datos Institucionales</h2>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Responsable</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Equipo de territorio</p>
                <p className="font-bold text-gray-800 text-sm uppercase">{ficha.equipoTerritorio || 'Sin asignar'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Encuestador Creador</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm uppercase">{nombreEncuestador}</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded font-sans font-bold tracking-wide">
                    C.C. {docEncuestador}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">CÓDIGO / NÚMERO DE HOGAR</p>
                <p className="font-bold text-gray-800 text-sm">{displayNumHogar}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">CÓDIGO / NÚMERO DE FAMILIA</p>
                <p className="font-bold text-gray-800 text-sm break-all">{displayNumFamilia}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">CÓDIGO DE FICHA</p>
                <p className="font-bold text-gray-800 text-sm break-all">{ficha.codFicha || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* REZHAZADA / NO EFECTIVA */}
        {ficha.estadoVisita !== '1' && (
          <div className={`border-2 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 ${
            ficha.estadoVisita === '2' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
          }`}>
            <div>
              <h3 className={`font-bold mb-1 ${ficha.estadoVisita === '2' ? 'text-orange-800' : 'text-red-800'}`}>
                Motivo: Identificación {estadoVisitaLabel}
              </h3>
              <p className={`text-sm font-medium break-words overflow-hidden ${ficha.estadoVisita === '2' ? 'text-orange-600' : 'text-red-600'}`}>
                {ficha.observacionesRechazo || "No se registró ninguna observación exacta en el sistema."}
              </p>
            </div>
            {onStartNew && (
              <button 
                onClick={() => onStartNew()}
                className={`px-6 py-2.5 rounded-xl font-bold shadow transition-colors flex items-center justify-center whitespace-nowrap text-white ${
                  ficha.estadoVisita === '2' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Nuevo Intento de Identificación
              </button>
            )}
          </div>
        )}

        {/* Fila 2: Vivienda etc */}
        {ficha.estadoVisita === '1' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Vivienda, Familia y Entorno</h2>
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Secciones II y III</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Tipo de Vivienda</p>
              <p className="font-bold text-gray-800 text-sm leading-tight uppercase">{getLabel(TIPO_VIVIENDA, ficha.tipoVivienda)}{ficha.tipoViviendaDesc ? ` - ${ficha.tipoViviendaDesc}` : ''}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Total Hogares</p>
              <p className="font-bold text-gray-800 text-xl">{ficha.numHogares || 1}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Estrato Social</p>
              <p className="font-bold text-gray-800 text-xl">{ficha.estratoSocial || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Dormitorios</p>
              <p className="font-bold text-gray-800 text-xl">{ficha.numDormitorios || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Hacinamiento</p>
              <p className={`font-bold text-xl ${ficha.hacinamiento ? 'text-red-600' : 'text-emerald-600'}`}>{ficha.hacinamiento ? 'Sí' : 'No'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Total Integrantes</p>
              <p className="font-bold text-gray-800 text-xl">{ficha.numIntegrantes || ficha.pacientes?.length || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">APGAR Familiar</p>
              <p className="font-bold text-gray-800 text-sm mt-1 leading-tight">{getApgarScoreText()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Ecomapa Familiar</p>
              <p className="font-bold text-gray-800 text-sm mt-1 leading-tight">{getEcomapaScoreText()}</p>
            </div>
            {ficha.cuidadorPrincipal && (
              <div>
                <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Sobrecarga Zarit</p>
                <p className="font-bold text-gray-800 text-sm mt-1 leading-tight">{getZaritScoreText()}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Vulnerabilidades Sociales</p>
              <p className="font-bold text-gray-800 text-xs mt-1 leading-normal uppercase">{getLabels(VULNERABILIDADES, ficha.vulnerabilidades)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Vectores / Plagas</p>
              <p className="font-bold text-gray-800 text-sm mt-1">{ficha.presenciaVectores ? 'Sí' : 'No'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Total de Animales</p>
              <p className="font-bold text-gray-800 text-xl">{ficha.cantAnimales || 0}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">Mascotas (Tipos y Vacunación)</p>
              {ficha.cantAnimales > 0 ? (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="font-bold text-gray-800 text-xs uppercase">{getLabels(ANIMALES, ficha.animales)}</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${ficha.vacunacionMascotas ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      {ficha.vacunacionMascotas ? 'Requiere Vacunación / Pendiente' : 'Vacunación al Día'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="font-medium text-gray-400 text-sm italic">Sin mascotas registradas</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-black text-[#081e69] uppercase tracking-widest mb-4">Servicios y Saneamiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Fuente de Agua', vals: ficha.fuenteAgua, catalog: FUENTE_AGUA, otro: ficha.otrosJson?.fuenteAguaOtro },
                { label: 'Disposición de Excretas', vals: ficha.dispExcretas, catalog: DISPOSICION_EXCRETAS, otro: ficha.otrosJson?.dispExcretasOtro },
                { label: 'Aguas Residuales', vals: ficha.aguasResiduales, catalog: AGUAS_RESIDUALES, otro: ficha.otrosJson?.aguasResidualesOtro },
                { label: 'Disposición de Residuos', vals: ficha.dispResiduos, catalog: DISPOSICION_RESIDUOS, otro: ficha.otrosJson?.dispResiduosOtro },
                { label: 'Riesgos de Accidente', vals: ficha.riesgoAccidente, catalog: RIESGO_ACCIDENTE, otro: ficha.otrosJson?.riesgoAccidenteOtro || ficha.otrosJson?.riesdeAccidenteOtro },
                { label: 'Fuente de Energía para Cocinar', vals: [ficha.fuenteEnergia], catalog: FUENTE_ENERGIA, otro: ficha.otrosJson?.fuenteEnergiaOtro }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase">{item.label}</p>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {Array.isArray(item.vals) && item.vals.filter(v => v !== null && v !== undefined && v !== '').length > 0 ? (
                      item.vals.filter(v => v !== null && v !== undefined && v !== '').map((v: any, index: number) => {
                        const lbl = getLabel(item.catalog, v);
                        if ((lbl === 'Otro' || lbl === 'Otros') && item.otro) {
                          return (
                            <span key={v} className="font-bold text-gray-800 text-sm uppercase">
                              {item.otro}{index < item.vals.length - 1 ? ', ' : ''}
                            </span>
                          );
                        }
                        return (
                          <span key={v} className="font-bold text-gray-800 text-sm uppercase">
                            {lbl}{index < item.vals.length - 1 ? ', ' : ''}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-gray-400 text-sm italic">No registrado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Fila 3: Censo */}
        {ficha.estadoVisita === '1' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Censo de Integrantes</h2>
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                Miembros del Hogar ({ficha.pacientes?.length || 0}) {getLabel(TIPO_FAMILIA, ficha.tipoFamilia).split(' (')[0]}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {ficha.pacientes?.map((pac: any, i: number) => {
              const iniciales = `${pac.nombres.charAt(0)}${pac.apellidos.charAt(0)}`.toUpperCase()
              return (
                <div key={pac.id || i} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-gray-200 hover:bg-white transition-all shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left Side: Avatar & Core Info */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#081e69]/10 text-[#081e69] font-black text-xs sm:text-base flex items-center justify-center flex-shrink-0">
                        {iniciales}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-gray-800 uppercase text-xs sm:text-sm leading-tight truncate">
                            {pac.nombres} {pac.apellidos}
                          </h3>
                          <span className="bg-blue-50 text-blue-700 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border border-blue-100 inline-block shrink-0">
                            {getLabel(PARENTESCO, pac.parentesco || 1)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <span className="bg-slate-500 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            {pac.tipoDoc} {pac.numDoc || pac.documento}
                          </span>
                          <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
                            Nac: <span className="font-semibold text-gray-700">{pac.fechaNacimiento}</span> ({calcularEdad(pac.fechaNacimiento)} años)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Metrics & Phone */}
                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-0 border-gray-100">
                      {/* Phone button */}
                      {pac.telefono ? (
                        <a 
                          href={`tel:${pac.telefono}`} 
                          className="flex items-center justify-center w-10 h-10 sm:w-[42px] sm:h-[42px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors shadow-sm shrink-0"
                          title={`Llamar al ${pac.telefono}`}
                        >
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                        </a>
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 sm:w-[42px] sm:h-[42px] bg-orange-50 text-orange-600 border border-orange-200 rounded-xl shadow-sm shrink-0" title="Sin teléfono registrado">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase text-center leading-tight">
                            Sin<br/>Tel
                          </span>
                        </div>
                      )}

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full lg:w-[320px]">
                        <div className="bg-white border text-center border-gray-200 rounded-xl px-2 py-1.5 shadow-sm min-w-0 flex flex-col justify-center items-center">
                          <p className="text-[8px] font-black text-gray-400 tracking-wider uppercase">Género</p>
                          <p className="font-bold text-[9px] sm:text-[10px] text-gray-800 uppercase leading-tight mt-0.5 break-words text-center">{pac.sexo?.toLowerCase() || 'N/A'}</p>
                        </div>
                        <div className="bg-white border text-center border-gray-200 rounded-xl px-2 py-1.5 shadow-sm min-w-0 flex flex-col justify-center items-center">
                          <p className="text-[8px] font-black text-gray-400 tracking-wider uppercase">Régimen</p>
                          <p className="font-bold text-[9px] sm:text-[10px] text-gray-800 uppercase leading-tight mt-0.5 break-words text-center">{pac.regimen || 'N/A'}</p>
                        </div>
                        <div className="bg-white border text-center border-gray-200 rounded-xl px-2 py-1.5 shadow-sm min-w-0 flex flex-col justify-center items-center">
                          <p className="text-[8px] font-black text-gray-400 tracking-wider uppercase">EPS</p>
                          <p className="font-bold text-[9px] sm:text-[10px] text-gray-800 uppercase leading-tight mt-0.5 break-words text-center">{pac.eapb || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )}

        {/* FAMILIOGRAMA AUTO-GENERADO o PERSONALIZADO */}
        {ficha.estadoVisita === '1' && (canManageFamiliograma || ficha.familiogramaCodigo) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Familiograma</h2>
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Representación Familiar</p>
                </div>
              </div>
              {canManageFamiliograma && (
                <button 
                  onClick={() => setShowFamiliograma(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0a8c32] text-white text-sm font-bold rounded-lg hover:bg-[#086a25] transition-colors shadow-sm"
                >
                  <Activity className="w-4 h-4" />
                  ABRIR EDITOR
                </button>
              )}
            </div>
            
            {ficha.familiogramaCodigo && !String(ficha.familiogramaCodigo).startsWith('{') ? (
               <FamiliogramaViewer code={ficha.familiogramaCodigo} />
            ) : ficha.familiogramaCodigo && String(ficha.familiogramaCodigo).startsWith('{') ? (
               <div className="mt-4 border rounded-xl overflow-hidden print:overflow-visible bg-white shadow-sm print:shadow-none print:border-gray-300">
                  <FamiliogramaStaticViewer jsonString={ficha.familiogramaCodigo} />
               </div>
            ) : (
               <div className="flex items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <p className="text-gray-500 font-medium text-center">
                   El sistema utiliza el Lienzo Profesional para esta familia pero aún no ha sido diseñado o guardado.<br/>
                   <span className="text-xs mt-1 block">Oprime el botón superior verde para abrir el editor e interactuar.</span>
                 </p>
               </div>
            )}
          </div>
        )}

        {/* PLAN DE CUIDADO PRIMARIO (PCP) */}
        {ficha.estadoVisita === '1' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Plan de Cuidado Primario (PCP)</h2>
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Registro de Visitas y Acuerdos</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSegObservacion('')
                  setSegAcuerdos(false)
                  setNuevosCompromisos([])
                  setNuevoCompromisoTexto('')
                  setNuevoCompromisoPaciente('')
                  setNuevoCompromisoFecha('')
                  
                  // Obtener TODOS los compromisos pendientes
                  const pendientes = (ficha.compromisos || [])
                    .filter((c: any) => c.estado === 'PENDIENTE')
                    
                  setCompromisosModificados(pendientes.map((c: any) => ({ ...c })))
                  setShowSeguimientoModal(true)
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Nueva Visita de Seguimiento
              </button>
            </div>
            
            {/* HISTORIAL COMPLETO DE COMPROMISOS */}
            {ficha.compromisos && ficha.compromisos.length > 0 && (
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-teal-600" /> Evolución de Logros y Acuerdos
                </h4>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Tipo / Sujeto</th>
                        <th className="px-4 py-3">Logro / Acuerdo Pactado</th>
                        <th className="px-4 py-3">Estado Actual</th>
                        <th className="px-4 py-3">Evolución / Responsable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ficha.compromisos.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider block w-max mb-1 ${!c.pacienteId ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {!c.pacienteId ? 'Acuerdo Familiar' : 'Acuerdo Individual'}
                            </span>
                            {c.paciente && <span className="text-xs text-gray-600 font-medium truncate max-w-[150px] inline-block">{c.paciente.nombres}</span>}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-normal min-w-[200px]">{c.descripcion}</td>
                          <td className="px-4 py-3">
                            {c.estado === 'PENDIENTE' && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-bold">Pendiente</span>}
                            {c.estado === 'CUMPLIDO' && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-bold">Cumplido</span>}
                            {c.estado === 'INCUMPLIDO' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Incumplido</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-normal min-w-[200px]">
                            <div className="flex flex-col gap-1">
                              <span>Creado en: Seg. N° {c.creadoEn?.consecutivo || '?'}</span>
                              {c.verificadoEn && <span>Verificado en: Seg. N° {c.verificadoEn?.consecutivo}</span>}
                              {c.observacion && <span className="italic mt-1 text-gray-700">Obs: "{c.observacion}"</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-600" /> Historial de Novedades y Evolución
            </h4>
            {ficha.seguimientos && ficha.seguimientos.length > 0 ? (
              <div className="space-y-4">
                {paginatedSeguimientos.map((seg: any) => (
                  <div key={seg.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase">
                          Seguimiento N° {seg.consecutivo}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(seg.createdAt || seg.fecha).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteSeguimiento(seg.id)}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors flex items-center justify-center"
                          title="Eliminar Seguimiento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{seg.observacion}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-black">
                      Por: {seg.responsable?.nombre} {seg.responsable?.apellidos} ({seg.responsable?.rol})
                    </p>
                  </div>
                ))}

                {/* Controles de Paginación Seguimientos */}
                {totalSegPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Página {segPage} de {totalSegPages}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSegPage(p => Math.max(1, p - 1))}
                        disabled={segPage <= 1}
                        className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Anterior
                      </button>
                      <button 
                        onClick={() => setSegPage(p => Math.min(totalSegPages, p + 1))}
                        disabled={segPage >= totalSegPages}
                        className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <p className="text-gray-500 font-medium text-center">
                   Aún no se han registrado seguimientos para esta familia.
                 </p>
              </div>
            )}
          </div>
        )}

      </div>

      {showFamiliograma && ficha?.id && (
        <FamiliogramaGlobalEditor 
          fichaId={ficha.id} 
          onClose={() => {
            setShowFamiliograma(false)
            if (onRefreshFicha) onRefreshFicha()
          }} 
        />
      )}

      {showSeguimientoModal && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if(e.target === e.currentTarget) setShowSeguimientoModal(false) }}
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-black text-gray-800 mb-4">Visita de Seguimiento N° {(ficha.seguimientos?.length || 0) + 1} al Plan de Cuidado</h2>
            
            <div className="space-y-6">
              {/* Sección 1: Compromisos Anteriores */}
              {compromisosModificados.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">De la visita anterior quedaron estos acuerdos: ¿Se cumplieron?</h3>
                  <div className="space-y-3">
                    {compromisosModificados.map((comp, idx) => (
                      <div key={comp.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${!comp.pacienteId ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {!comp.pacienteId ? 'Acuerdo Familiar' : 'Acuerdo Individual'}
                            </span>
                            <p className="text-sm font-medium text-gray-800 mt-1">{comp.descripcion}</p>
                            {comp.paciente && <p className="text-xs text-gray-500 mt-0.5">Asignado a: <span className="font-bold">{comp.paciente.nombres} {comp.paciente.apellidos}</span></p>}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input type="radio" name={`estado-${comp.id}`} value="CUMPLIDO" className="text-emerald-600 focus:ring-emerald-500" 
                                checked={comp.estado === 'CUMPLIDO'} 
                                onChange={() => { const copy = [...compromisosModificados]; copy[idx].estado = 'CUMPLIDO'; setCompromisosModificados(copy); }} 
                              /> Cumplido
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input type="radio" name={`estado-${comp.id}`} value="INCUMPLIDO" className="text-red-600 focus:ring-red-500"
                                checked={comp.estado === 'INCUMPLIDO'} 
                                onChange={() => { const copy = [...compromisosModificados]; copy[idx].estado = 'INCUMPLIDO'; setCompromisosModificados(copy); }} 
                              /> No Cumplido
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer text-gray-500">
                              <input type="radio" name={`estado-${comp.id}`} value="PENDIENTE" className="text-gray-400 focus:ring-gray-400"
                                checked={comp.estado === 'PENDIENTE'} 
                                onChange={() => { const copy = [...compromisosModificados]; copy[idx].estado = 'PENDIENTE'; setCompromisosModificados(copy); }} 
                              /> Sigue Pendiente
                            </label>
                          </div>
                          {(comp.estado === 'INCUMPLIDO' || comp.estado === 'CUMPLIDO') && (
                            <input type="text" placeholder={`Observación sobre por qué fue ${comp.estado.toLowerCase()}...`} className="w-full text-sm p-2 border rounded bg-gray-50 mt-1" 
                               value={comp.observacion || ''} onChange={(e) => { const copy = [...compromisosModificados]; copy[idx].observacion = e.target.value; setCompromisosModificados(copy); }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección 2: Añadir Nuevos Compromisos */}
              <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Pactar Nuevos Logros y Acuerdos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción del Logro / Acuerdo Pactado</label>
                    <input type="text" className="w-full p-2 border rounded-lg text-sm bg-white" placeholder="Ej: Tomar medicamento a las 8am por 30 días" value={nuevoCompromisoTexto} onChange={e => setNuevoCompromisoTexto(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo / Asignación</label>
                    <select className="w-full p-2 border rounded-lg text-sm bg-white" value={nuevoCompromisoPaciente} onChange={e => setNuevoCompromisoPaciente(e.target.value)}>
                      <option value="">Familiar (Todo el grupo)</option>
                      {ficha.pacientes?.map((p: any) => (
                        <option key={p.id} value={p.id}>Individual: {p.nombres} {p.apellidos} ({p.numDoc})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Meta (Opcional)</label>
                    <input type="date" className="w-full p-2 border rounded-lg text-sm bg-white" value={nuevoCompromisoFecha} onChange={e => setNuevoCompromisoFecha(e.target.value)} />
                  </div>
                </div>
                <button type="button" 
                  className="w-full py-2 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                  disabled={!nuevoCompromisoTexto.trim()}
                  onClick={() => {
                    setNuevosCompromisos([...nuevosCompromisos, { descripcion: nuevoCompromisoTexto, pacienteId: nuevoCompromisoPaciente, fechaMeta: nuevoCompromisoFecha }]);
                    setNuevoCompromisoTexto(''); setNuevoCompromisoFecha(''); setNuevoCompromisoPaciente('');
                  }}>
                  <Plus className="w-4 h-4"/> Añadir Acuerdo al Plan
                </button>

                {nuevosCompromisos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {nuevosCompromisos.map((nc, idx) => {
                       const pac = ficha.pacientes?.find((p: any) => p.id === nc.pacienteId)
                       return (
                        <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-2.5 border rounded shadow-sm text-sm gap-2">
                          <div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mr-2 ${!nc.pacienteId ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{!nc.pacienteId ? 'Acuerdo Familiar' : 'Acuerdo Individual'}</span>
                            <span className="font-medium text-gray-800">{nc.descripcion}</span>
                            {nc.pacienteId && <span className="text-xs text-gray-500 block mt-0.5">Asignado a: <span className="font-bold">{pac?.nombres}</span></span>}
                          </div>
                          <button onClick={() => setNuevosCompromisos(nuevosCompromisos.filter((_, i) => i !== idx))} className="text-red-500 bg-red-50 px-2 py-1 rounded hover:bg-red-100 hover:text-red-700 text-xs font-bold shrink-0">Quitar</button>
                        </div>
                       )
                    })}
                  </div>
                )}
              </div>

              {/* Observación general */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Evolución y Novedades del Encuentro</label>
                <textarea 
                  rows={3} 
                  className="w-full p-3 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  placeholder="Registre cambios en la salud, nuevos riesgos o situaciones destacadas de este encuentro..."
                  value={segObservacion}
                  onChange={e => setSegObservacion(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setShowSeguimientoModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
                disabled={isSubmittingSeg}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (!user) return toast.error("Usuario no autenticado");
                  setIsSubmittingSeg(true);
                  const toastId = toast.loading("Guardando seguimiento y actualizando compromisos...");
                  try {
                    const res = await fetch(`/api/identificaciones/${ficha.id}/seguimientos`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        observacion: segObservacion,
                        acuerdosCumplidos: segAcuerdos,
                        responsableId: user.id,
                        compromisosActualizados: compromisosModificados,
                        nuevosCompromisos: nuevosCompromisos
                      })
                    });
                    if (!res.ok) throw new Error(await res.text());
                    toast.success("Seguimiento añadido correctamente", { id: toastId });
                    setShowSeguimientoModal(false);
                    if (onRefreshFicha) onRefreshFicha();
                  } catch (e: any) {
                    toast.error(e.message || "Error guardando", { id: toastId });
                  } finally {
                    setIsSubmittingSeg(false);
                  }
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                disabled={isSubmittingSeg || (!segObservacion.trim() && compromisosModificados.every(c => c.estado === 'PENDIENTE') && nuevosCompromisos.length === 0)}
              >
                {isSubmittingSeg ? 'Guardando...' : 'Guardar Seguimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
