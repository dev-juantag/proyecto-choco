import { 
  ESTADO_VISITA, TIPO_VIVIENDA, MATERIAL_PAREDES, MATERIAL_PISOS, MATERIAL_TECHOS,
  FUENTE_AGUA, DISPOSICION_EXCRETAS, AGUAS_RESIDUALES, DISPOSICION_RESIDUOS, RIESGO_ACCIDENTE,
  FUENTE_ENERGIA, ANIMALES, TIPO_FAMILIA, APGAR_OPCIONES, ZARIT_OPCIONES, ECOMAPA_OPCIONES,
  VULNERABILIDADES, DIAGNOSTICO_NUTRICIONAL, PARENTESCO, REGIMEN_SALUD, OCUPACION,
  APGAR_PREGUNTAS, ECOMAPA_PREGUNTAS, ZARIT_PREGUNTAS, ETNIA, GRUPO_POBLACIONAL, 
  BARRERAS_ACCESO, DISCAPACIDADES, NIVEL_EDUCATIVO, ANTECEDENTES_CRONICOS,
  ANTECEDENTES_TRANSMISIBLES, INTERVENCIONES_PENDIENTES, REMISIONES_SISTEMA, PERFIL_ENCUESTADOR,
  ESTADO_CONSERVACION, ESTADO_BANO, RIESGOS_CAMBIO_CLIMATICO, TIPO_MINERIA_OPCIONES, ORIGEN_EXPOSICION_METALES
} from '@/lib/constants'
import FamiliogramaViewer from './FamiliogramaViewer'
import FamiliogramaStaticViewer from './FamiliogramaStaticViewer'

export default function FacturaFicha({ ficha, autoPrint, showOnScreen }: { ficha: any, autoPrint?: boolean, showOnScreen?: boolean }) {
  if (!ficha) return null

  const esImpar = (ficha.pacientes?.length || 0) % 2 !== 0;

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculateIMC = (peso: number | null | undefined, tallaCm: number | null | undefined) => {
    if (!peso || !tallaCm) return { imc: 'null', clasificacion: 'null' };
    const tallaM = tallaCm / 100;
    const imcVal = peso / (tallaM * tallaM);
    let clasificacion = 'Normal';
    if (imcVal < 18.5) clasificacion = 'Bajo peso';
    else if (imcVal < 25) clasificacion = 'Normal';
    else if (imcVal < 30) clasificacion = 'Sobrepeso';
    else if (imcVal < 35) clasificacion = 'Obesidad Grado I';
    else if (imcVal < 40) clasificacion = 'Obesidad Grado II';
    else clasificacion = 'Obesidad Grado III';
    return { imc: imcVal.toFixed(1), clasificacion };
  }

  const getLabel = (arr: any[], id: any) => {
    if (id && typeof id === 'object') {
      const realId = id.id || id.key || Object.keys(id)[0];
      return arr.find(x => String(x.id) === String(realId))?.label || realId || 'N/A';
    }
    return arr.find(x => String(x.id) === String(id))?.label || id || 'N/A';
  }
  
  const getLabels = (arr: any[], ids: any[]) => {
    if (!ids) return 'Ninguno';
    const parsedIds = Array.isArray(ids) ? ids : (typeof ids === 'object' ? Object.keys(ids).filter(k => ids[k] === true) : [ids]);
    if (parsedIds.length === 0) return 'Ninguno';
    return parsedIds.map(id => getLabel(arr, id)).join(', ');
  }

  const parseMedicalHistoryList = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(item => {
        if (item && typeof item === 'object') {
          return item.id || item.key || Object.keys(item)[0];
        }
        return item;
      }).filter(Boolean);
    }
    if (typeof val === 'object') {
      return Object.keys(val).filter(key => val[key] === true || val[key] === 'true');
    }
    return [val];
  };

  const getLabelsWithOtros = (arr: any[], ids: any[], otroVal: string | null | undefined) => {
    if (!ids) return 'Ninguno';
    const parsedIds = Array.isArray(ids) ? ids : (typeof ids === 'object' ? Object.keys(ids).filter(k => ids[k] === true) : [ids]);
    if (parsedIds.length === 0) return 'Ninguno';
    return parsedIds.map(id => {
      const lbl = getLabel(arr, id);
      if ((lbl === 'Otro' || lbl === 'Otros') && otroVal) {
        return otroVal;
      }
      return lbl;
    }).join(', ');
  }

  const getMetalRiskScoreText = (meta: any) => {
    if (!meta || meta.aplicaExposicion !== true) return { value: 'BAJO', label: 'BAJO' };
    let pts = 0;
    if (meta.ocupacion && meta.ocupacion !== 'NINGUNA' && meta.ocupacion !== 'Ninguna') pts += 2;
    if (meta.ocupacionTiempo === '1-5') pts += 1;
    else if (meta.ocupacionTiempo === 'mas-5' || meta.ocupacionTiempo === '6-10' || meta.ocupacionTiempo === 'mas-10') pts += 2;
    if (meta.continuaExpuesto === 'SI' || meta.continuaExpuesto === 'Si') pts += 2;
    if (meta.utilizaEPP === 'ALGUNAS_VECES' || meta.utilizaEPP === 'Algunas veces') pts += 1;
    else if (meta.utilizaEPP === 'NUNCA' || meta.utilizaEPP === 'Nunca') pts += 2;
    if (meta.ambiental && meta.ambiental !== 'NINGUNO' && meta.ambiental !== 'Ninguno') pts += 2;
    if (meta.ambientalTiempo === '1-5') pts += 1;
    else if (meta.ambientalTiempo === 'mas-5') pts += 2;
    if (meta.pescado === 'OCASIONAL' || meta.pescado === 'Ocasional') pts += 1;
    else if (meta.pescado === '1_2_SEMANA' || meta.pescado === '1 o 2 veces por semana' || meta.pescado === '3_MAS') pts += 2;
    if (meta.amalgamas === 'SI_10_MAS' || meta.amalgamas === 'si, mas de 10 años') pts += 1;

    if (pts >= 10) return { value: 'ALTO', label: 'ALTO' };
    if (pts >= 5) return { value: 'MEDIO', label: 'MEDIO' };
    return { value: 'BAJO', label: 'BAJO' };
  }

  const getOcupacionTiempoLabel = (val: string) => {
    if (!val) return 'null';
    if (val === '1-5') return '1 a 5 años';
    if (val === 'mas-5' || val === '6-10' || val === 'mas-10') return 'mas de 5 años';
    return val;
  }
  const getAmbientalTiempoLabel = (val: string) => {
    if (!val) return 'null';
    if (val === '1-5') return '1 a 5 años';
    if (val === 'mas-5') return 'mas de 5 años';
    return val;
  }
  const getPescadoLabel = (val: string) => {
    if (!val) return 'null';
    if (val === '1_2_SEMANA') return '1 o 2 veces por semana';
    if (val === '3_MAS') return '3 o más veces por semana';
    if (val === 'OCASIONAL') return 'Ocasional';
    return val;
  }
  const getAmalgamasLabel = (val: string) => {
    if (!val) return 'null';
    if (val === 'SI_10_MAS') return 'si, mas de 10 años';
    if (val === 'SI_MENOS_10') return 'si, menos de 10 años';
    return val;
  }

  // Formato visual para IDs garantizando que tengan el código del territorio y hogar para trazabilidad
  const codigoTerritorio = ficha.territorioCodigo || ficha.territorio?.codigo || ''
  let displayNumHogar = ficha.numHogar || '-';
  if (ficha.numHogar && codigoTerritorio && !ficha.numHogar.startsWith(codigoTerritorio)) {
    displayNumHogar = `${codigoTerritorio}${ficha.numHogar.replace(/^H?/, 'H')}`;
  }
  let displayNumFamilia = ficha.numFamilia || '-';
  if (ficha.numFamilia && displayNumHogar !== '-' && !ficha.numFamilia.startsWith(displayNumHogar)) {
    displayNumFamilia = `${displayNumHogar}${ficha.numFamilia.replace(/^F?/, 'F')}`;
  }

  // Estilos base para la impresión
  const sectionCls = "mb-5 print:mb-3"
  const headerCls = "font-black text-base uppercase mb-2 pb-1 border-b-2 border-black print:text-sm print:mb-2 print:pb-1"
  const tblCls = "w-full text-left border-collapse mb-4 print:mb-3 print:break-inside-avoid"
  const thCls = "font-bold text-xs w-1/3 py-1 align-top uppercase border-b border-gray-300 print:text-[10.5px] print:py-0.8"
  const tdCls = "text-xs py-1 align-top border-b border-gray-200 print:text-[10.5px] print:py-0.8"

  const Th = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => <th className={`${thCls} ${className || ''}`} style={style}>{children}</th>
  const Td = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => <td className={`${tdCls} ${className || ''}`} style={style}>{children}</td>

  return (
    <>
    <style type="text/css" media="print">
      {`
        @page {
          margin-top: 1.8cm;
          margin-bottom: 2.5cm;
          margin-left: 1cm;
          margin-right: 1cm;
        }
        body {
          background-color: white !important;
        }
      `}
    </style>
    
    <div className={`${showOnScreen ? 'block' : 'absolute w-[1024px] h-auto -z-50 top-[-99999px] left-[-99999px] pointer-events-none print:static print:w-[1024px] print:h-auto print:opacity-100 print:overflow-visible print:pointer-events-auto'} font-sans text-black bg-white max-w-none mx-auto p-4 md:p-8 leading-normal relative`}>
      
      {/* PIE DE PAGINA FIJO EN CADA HOJA AL IMPRIMIR */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center text-xs text-gray-500 uppercase italic pt-2.5 pb-2 bg-white border-t border-gray-300 w-full z-50">
        <p className="font-bold text-black text-[10px]">** DOCUMENTO DE CARÁCTER CONFIDENCIAL Y RESTRINGIDO **</p>
        <p className="mt-0.5 normal-case text-[9px] text-gray-500">Los datos de salud e identificación familiar pertenecen al sistema departamental y su uso está regulado por la Ley de Protección de Datos Personales.</p>
        <p className="mt-0.5 font-mono text-[8px] text-gray-400">{ficha.id?.toUpperCase()}</p>
      </div>

      <div className="relative z-10 pb-16">
      {/* HEADER GLOBAL */}
      <div className="flex items-center justify-between mb-6 pb-3" style={{ borderBottom: '4px solid black' }}>
        <img src="/logo-optimus-green.png" alt="Logo Optimus Green" className="w-24 h-24 shrink-0 object-contain" />
        <div className="text-center px-4 flex-1">
          <h1 className="font-black text-2xl uppercase tracking-widest">Identificación Familiar</h1>
          <p className="font-bold text-base mt-1 tracking-widest text-gray-600">FICHA OFICIAL NO. {ficha.consecutivo || ficha.id?.substring(0,8)}</p>
          <p className="mt-0.5 font-sans text-xs text-gray-500">Documento impreso el {new Date().toLocaleString('es-CO')}</p>
        </div>
        <img src="/logo-cimentamos.png" alt="Logo Cimentamos" className="w-20 h-20 shrink-0 object-contain" />
      </div>

      {/* CASO A: FICHA RECHAZADA O NO EFECTIVA (VERSIÓN CORTA) */}
      {ficha.estadoVisita !== '1' ? (
        <div className="space-y-6">
          <div>
            <h2 className={headerCls}>1. Control y Responsables</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Estado de la Visita</Th><Td><span className="font-bold uppercase bg-gray-200 px-2 py-1 rounded">{getLabel(ESTADO_VISITA, ficha.estadoVisita)}</span></Td></tr>
                <tr><Th>Fecha de Diligenciamiento</Th><Td>{new Date(ficha.fechaDiligenciamiento).toLocaleString('es-CO')}</Td></tr>
                <tr><Th>Responsable / Encuestador</Th><Td>{ficha.encuestador ? `${ficha.encuestador.nombre} ${ficha.encuestador.apellidos}` : (ficha.encuestadorNombreRaw || ficha.perfilEncuestador || 'N/A')}</Td></tr>
                <tr><Th>Perfil del Encuestador</Th><Td className="uppercase">{getLabel(PERFIL_ENCUESTADOR, ficha.perfilEncuestador)}</Td></tr>
                <tr><Th>Doc. Encuestador</Th><Td>{ficha.encuestador ? `${ficha.encuestador.documento}` : (ficha.encuestadorDocRaw || ficha.numDocEncuestador || 'N/A')}</Td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <h2 className={headerCls}>2. Ubicación y Georreferenciación</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Municipio</Th><Td>{ficha.municipio}</Td></tr>
                <tr><Th>Dirección</Th><Td>{ficha.direccion}</Td></tr>
                <tr><Th>GPS</Th><Td className="font-sans text-xs">{(ficha.latitud != null && ficha.longitud != null) ? `Lat: ${Number(ficha.latitud).toFixed(7)}, Lng: ${Number(ficha.longitud).toFixed(7)}` : 'Sin coordenadas'}</Td></tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 border-2 border-black rounded-lg">
             <h2 className="font-black text-base uppercase mb-1">3. Motivo de No Efectividad / Rechazo</h2>
             <p className="text-base font-bold italic">
               &quot;{ficha.observacionesRechazo || 'No se registraron observaciones adicionales por parte del encuestador.'}&quot;
             </p>
          </div>
        </div>
      ) : (
        /* CASO B: FICHA EFECTIVA (VERSIÓN COMPLETA) */
        <>
          {/* PAGINA 1: Control, Códigos, Ubicación y Características Físicas de la Vivienda */}
          <div className={sectionCls} style={{ pageBreakAfter: 'always' }}>
            <h2 className={headerCls}>1. Control y Responsables</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Estado de la Visita</Th><Td><span className="font-bold uppercase bg-gray-200 px-2 py-0.5 rounded">{getLabel(ESTADO_VISITA, ficha.estadoVisita)}</span></Td></tr>
                <tr><Th>Fecha de Diligenciamiento</Th><Td>{new Date(ficha.fechaDiligenciamiento).toLocaleString('es-CO')}</Td></tr>
                <tr><Th>Equipo de territorio</Th><Td>{ficha.equipoTerritorio || 'N/A'}</Td></tr>
                <tr><Th>Código EBS (No. Identificación)</Th><Td>{ficha.numEBS || 'N/A'}</Td></tr>
                <tr><Th>Responsable / Encuestador</Th><Td>{ficha.encuestador ? `${ficha.encuestador.nombre} ${ficha.encuestador.apellidos}` : (ficha.encuestadorNombreRaw || ficha.perfilEncuestador || 'N/A')}</Td></tr>
                <tr><Th>Perfil del Encuestador</Th><Td className="uppercase">{getLabel(PERFIL_ENCUESTADOR, ficha.perfilEncuestador)}</Td></tr>
                <tr><Th>Doc. Encuestador</Th><Td>{ficha.encuestador ? `${ficha.encuestador.documento}` : (ficha.encuestadorDocRaw || ficha.numDocEncuestador || 'N/A')}</Td></tr>
              </tbody>
            </table>

            <h2 className={headerCls}>2. Códigos de Identificación</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Código / Número de Hogar</Th><Td className="font-sans font-bold">{displayNumHogar}</Td></tr>
                <tr><Th>Código / Número de Familia</Th><Td className="font-sans font-bold">{displayNumFamilia}</Td></tr>
                <tr><Th>Código de Ficha</Th><Td className="font-sans font-bold">{ficha.codFicha || 'N/A'}</Td></tr>
              </tbody>
            </table>

            <h2 className={headerCls}>3. Ubicación y Georreferenciación</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Departamento</Th><Td>{ficha.departamento}</Td></tr>
                <tr><Th>Municipio</Th><Td>{ficha.municipio}</Td></tr>
                <tr><Th>Clase de Centro Poblado</Th><Td>{ficha.centroPoblado || 'N/A'}</Td></tr>
                <tr><Th>Dirección</Th><Td>{ficha.direccion}</Td></tr>
                <tr><Th>Descripción de Ubicación</Th><Td>{ficha.descripcionUbicacion || 'N/A'}</Td></tr>
                <tr><Th>Georreferenciación (GPS)</Th><Td className="font-sans text-xs">{(ficha.latitud != null && ficha.longitud != null) ? `Lat: ${Number(ficha.latitud).toFixed(7)}, Lng: ${Number(ficha.longitud).toFixed(7)}` : 'Sin coordenadas registradas'}</Td></tr>
              </tbody>
            </table>

            <h2 className={headerCls}>4. Características Físicas y Conservación de la Vivienda</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Tipo de Vivienda</Th><Td>{getLabel(TIPO_VIVIENDA, ficha.tipoVivienda)}{ficha.tipoViviendaDesc ? ` - ${ficha.tipoViviendaDesc}` : ''}</Td></tr>
                <tr><Th>Material / Estado de Paredes</Th><Td>{getLabel(MATERIAL_PAREDES, ficha.matParedes)} <span className="font-bold">({getLabel(ESTADO_CONSERVACION, ficha.otrosJson?.estadoParedes || ficha.estadoParedes)})</span></Td></tr>
                <tr><Th>Material / Estado de Pisos</Th><Td>{getLabel(MATERIAL_PISOS, ficha.matPisos)} <span className="font-bold">({getLabel(ESTADO_CONSERVACION, ficha.otrosJson?.estadoPisos || ficha.estadoPisos)})</span></Td></tr>
                <tr><Th>Material / Estado de Techos</Th><Td>{getLabel(MATERIAL_TECHOS, ficha.matTechos)} <span className="font-bold">({getLabel(ESTADO_CONSERVACION, ficha.otrosJson?.estadoTechos || ficha.estadoTechos)})</span></Td></tr>
                <tr><Th>Estado de Baño / Sanitario</Th><Td><span className="font-bold">{getLabel(ESTADO_BANO, ficha.otrosJson?.estadoBano || ficha.estadoBano)}</span></Td></tr>
                <tr><Th>Estado de Cocina</Th><Td><span className="font-bold">{getLabel(ESTADO_CONSERVACION, ficha.otrosJson?.estadoCocina || ficha.estadoCocina)}</span></Td></tr>
                <tr><Th>Total Hogares en Vivienda</Th><Td>{ficha.numHogares || 1}</Td></tr>
                <tr><Th>Dormitorios Exclusivos</Th><Td>{ficha.numDormitorios || 0}</Td></tr>
                <tr><Th>Estrato Social</Th><Td>{ficha.estratoSocial || 'N/A'}</Td></tr>
                <tr><Th>Hacinamiento Habitacional</Th><Td>{ficha.hacinamiento ? 'Sí (Crítico)' : 'No'}</Td></tr>
                <tr>
                  <Th>Fuente de Energía Principal</Th>
                  <Td>
                    {(() => {
                      const lbl = getLabel(FUENTE_ENERGIA, ficha.fuenteEnergia);
                      if ((lbl === 'Otro' || lbl === 'Otros') && ficha.otrosJson?.fuenteEnergiaOtro) {
                        return ficha.otrosJson.fuenteEnergiaOtro;
                      }
                      return lbl;
                    })()}
                  </Td>
                </tr>
                {(ficha.otrosJson?.observacionesInmueble || ficha.observacionesInmueble) && (
                  <tr><Th>Observaciones de Inmueble / Mejoras</Th><Td className="italic font-bold">{ficha.otrosJson?.observacionesInmueble || ficha.observacionesInmueble}</Td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINA 2: Saneamiento, Composición y Escalas APGAR, ECOMAPA y ZARIT */}
          <div className={sectionCls} style={{ pageBreakBefore: 'always', paddingTop: '0.4cm' }}>
            <h2 className={headerCls}>5. Salud Ambiental y Saneamiento Básico</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Fuente Principal de Agua</Th><Td>{getLabelsWithOtros(FUENTE_AGUA, ficha.fuenteAgua, ficha.otrosJson?.fuenteAguaOtro)}</Td></tr>
                {(ficha.otrosJson?.fuenteAguaTratamiento || ficha.fuenteAguaTratamiento) && (
                  <tr><Th>Tratamiento de Agua para Consumo</Th><Td className="font-bold">{ficha.otrosJson?.fuenteAguaTratamiento || ficha.fuenteAguaTratamiento}</Td></tr>
                )}
                <tr><Th>Servicio Sanitario / Excretas</Th><Td>{getLabelsWithOtros(DISPOSICION_EXCRETAS, ficha.dispExcretas, ficha.otrosJson?.dispExcretasOtro)}</Td></tr>
                <tr><Th>Disposición Aguas Residuales</Th><Td>{getLabelsWithOtros(AGUAS_RESIDUALES, ficha.aguasResiduales, ficha.otrosJson?.aguasResidualesOtro)}</Td></tr>
                <tr><Th>Recolección de Residuos</Th><Td>{getLabelsWithOtros(DISPOSICION_RESIDUOS, ficha.dispResiduos, ficha.otrosJson?.dispResiduosOtro)}</Td></tr>
                <tr><Th>Riesgos en la Vivienda</Th><Td>{getLabelsWithOtros(RIESGO_ACCIDENTE, ficha.riesgoAccidente, ficha.otrosJson?.riesgoAccidenteOtro || ficha.otrosJson?.riesdeAccidenteOtro)}</Td></tr>
                <tr><Th>Riesgos por Cambio Climático</Th><Td className="font-bold">{getLabels(RIESGOS_CAMBIO_CLIMATICO, ficha.otrosJson?.riesgosCambioClimatico || ficha.riesgosCambioClimatico)}</Td></tr>
                <tr><Th>Presencia de Vectores</Th><Td>{ficha.presenciaVectores ? 'Sí' : 'No'}</Td></tr>
                <tr><Th>Tenencia de Mascotas</Th><Td>{getLabelsWithOtros(ANIMALES, ficha.animales, ficha.otrosJson?.animalesOtro)} (Total: {ficha.cantAnimales || 0})</Td></tr>
                {(ficha.cantAnimales > 0) && (
                  <tr><Th>Vacunación de Mascotas</Th><Td>{ficha.vacunacionMascotas ? 'Requiere / Pendiente' : 'Al día'}</Td></tr>
                )}
              </tbody>
            </table>

            <h2 className={headerCls}>6. Composición y Dinámica Socioeconómica Familiar</h2>
            <table className={tblCls}>
              <tbody>
                <tr><Th>Tipo de Familia</Th><Td>{getLabel(TIPO_FAMILIA, ficha.tipoFamilia)}</Td></tr>
                <tr><Th>Número de Integrantes</Th><Td>{ficha.numIntegrantes || 0}</Td></tr>
                <tr><Th>Integrantes en Minería</Th><Td className="font-bold text-amber-900">{ficha.otrosJson?.numIntegrantesMineria || ficha.numIntegrantesMineria || 0} persona(s)</Td></tr>
                <tr><Th>Vulnerabilidades del Hogar</Th><Td className="uppercase">{getLabels(VULNERABILIDADES, ficha.vulnerabilidades)}</Td></tr>
              </tbody>
            </table>

            <h2 className={headerCls}>7. Funcionamiento Familiar (Apgar)</h2>
            <table className={tblCls}>
              <tbody>
                {APGAR_PREGUNTAS.map((pregunta: string, idx: number) => {
                  const valorRespuesta = ficha.apgarRespuestas ? ficha.apgarRespuestas[idx] : null;
                  const APGAR_VALORES = ['Nunca (0)', 'Casi nunca (1)', 'A veces (2)', 'Casi siempre (3)', 'Siempre (4)'];
                  const textoRespuesta = valorRespuesta != null ? APGAR_VALORES[valorRespuesta] : 'No respondido';
                  return (
                    <tr key={idx}>
                      <Th className="font-medium text-[10.5px]">{pregunta}</Th>
                      <Td className="font-bold text-[10.5px]">{textoRespuesta}</Td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-100 italic">
                  <Th className="font-black">Resultado Apgar</Th>
                  <Td className="font-black text-xs">
                    {(() => {
                      let cat = getLabel(APGAR_OPCIONES, ficha.apgar).split(' (')[0];
                      if (ficha.apgarRespuestas && Array.isArray(ficha.apgarRespuestas)) {
                        const valid = ficha.apgarRespuestas.filter((v:any) => v !== null && v !== undefined);
                        if (valid.length > 0) {
                          const score = ficha.apgarRespuestas.reduce((a: number,b: number) => a + (b || 0), 0);
                          if (score >= 17) cat = 'Normal';
                          else if (score >= 13) cat = 'Disfunción leve';
                          else if (score >= 10) cat = 'Disfunción moderada';
                          else cat = 'Disfunción severa';
                        }
                      }
                      return cat;
                    })()}
                  </Td>
                </tr>
              </tbody>
            </table>

            <h2 className={headerCls}>8. Ecomapa Familiar y Redes de Apoyo</h2>
            <table className={tblCls}>
              <tbody>
                {ECOMAPA_PREGUNTAS.map((pregunta: string, idx: number) => {
                  const valorRespuesta = ficha.ecomapaRespuestas ? ficha.ecomapaRespuestas[idx] : null;
                  const ECOMAPA_VALORES = ['No (0)', 'Parcialmente (1)', 'Sí (2)'];
                  const textoRespuesta = valorRespuesta != null ? ECOMAPA_VALORES[valorRespuesta] : 'No respondido';
                  return (
                    <tr key={idx}>
                      <Th className="font-medium text-[10.5px]">{pregunta}</Th>
                      <Td className="font-bold text-[10.5px]">{textoRespuesta}</Td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-100 italic">
                  <Th className="font-black">Resultado Ecomapa</Th>
                  <Td className="font-black text-xs">
                    {getLabel(ECOMAPA_OPCIONES, ficha.ecomapa).split(' (')[0]}
                  </Td>
                </tr>
              </tbody>
            </table>

            <h2 className={headerCls}>9. Carga del Cuidador (Zarit)</h2>
            <table className={tblCls}>
              <tbody>
                <tr>
                  <Th>Cuidador Principal en Casa</Th>
                  <Td className="font-bold">{ficha.cuidadorPrincipal ? 'Sí' : 'No'}</Td>
                </tr>
                {ficha.cuidadorPrincipal && (
                  <>
                    {ZARIT_PREGUNTAS.map((pregunta: string, idx: number) => {
                      const valorRespuesta = ficha.zaritRespuestas ? ficha.zaritRespuestas[idx] : null;
                      const ZARIT_VALORES = ['Nunca (0)', 'Rara vez (1)', 'Algunas veces (2)', 'Bastantes veces (3)', 'Casi siempre (4)'];
                      const textoRespuesta = valorRespuesta != null ? ZARIT_VALORES[valorRespuesta] : 'No respondido';
                      return (
                        <tr key={idx}>
                          <Th className="font-medium text-[10.5px]">{pregunta}</Th>
                          <Td className="font-bold text-[10.5px]">{textoRespuesta}</Td>
                        </tr>
                      )
                    })}
                    <tr className="bg-gray-100 italic">
                      <Th className="font-black">Nivel de Sobrecarga (Zarit)</Th>
                      <Td className="font-black text-xs">
                        {getLabel(ZARIT_OPCIONES, ficha.zarit).split(' (')[0]}
                      </Td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINA 3: Familiograma */}
          {ficha.familiogramaCodigo && (
            <div className={sectionCls} style={{ pageBreakBefore: 'always', paddingTop: '0.4cm' }}>
              <h2 className={headerCls}>Familiograma Clínico</h2>
              <div className="border border-slate-300 rounded min-h-[600px] h-auto relative w-full">
                {!String(ficha.familiogramaCodigo).startsWith('{') ? (
                  <FamiliogramaViewer code={ficha.familiogramaCodigo} />
                ) : (
                  <FamiliogramaStaticViewer jsonString={ficha.familiogramaCodigo} isPrintView={true} />
                )}
              </div>
            </div>
          )}

          {/* PAGINAS DE INTEGRANTES */}
          <div className={sectionCls} style={{ pageBreakBefore: 'always', paddingTop: '0.4cm' }}>
            <h2 className={headerCls}>10. Censo e Información de Integrantes</h2>
            {ficha.pacientes && ficha.pacientes.length > 0 ? (
              ficha.pacientes.map((int: any, intIdx: number) => {
                const globalIdx = intIdx + 1;
                return (
                  <div 
                    key={int.id || intIdx} 
                    className="mb-6 border-b-2 border-dashed border-gray-300 pb-4 last:border-0 print:mb-2 print:pb-2 print:break-inside-avoid"
                    style={intIdx > 0 && intIdx % 2 === 0 ? { pageBreakBefore: 'always', paddingTop: '0.4cm' } : {}}
                  >
                    {/* ID & Nombres */}
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                        #{globalIdx}
                      </div>
                      <h3 className="font-black text-sm sm:text-base uppercase">
                        {int.nombres ? `${int.nombres} ${int.apellidos}` : `${int.primerNombre || ''} ${int.segundoNombre || ''} ${int.primerApellido || ''} ${int.segundoApellido || ''}`.trim()}
                      </h3>
                    </div>

                    {/* Información Básica */}
                    <div className="grid grid-cols-2 gap-x-6">
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          <tr><th className="font-bold py-0.5 w-2/5 border-b border-gray-100 print:text-[10px]">Documento:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{int.tipoDoc} {int.documento || int.numDoc}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Nacimiento:</th><td className="py-0.5 border-b border-gray-100 print:text-[10px]">{int.fechaNacimiento} ({calculateAge(int.fechaNacimiento)} años)</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Género:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{int.sexo}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Parentesco:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabel(PARENTESCO, int.parentesco)}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Régimen / EAPB:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabel(REGIMEN_SALUD, int.regimen)} / {int.eapb || '-'}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Ocupación:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabel(OCUPACION, int.ocupacion)}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Nivel Educativo:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabel(NIVEL_EDUCATIVO, int.nivelEducativo)}</td></tr>
                          <tr>
                            <th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Pertenencia Étnica:</th>
                            <td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">
                              {getLabel(ETNIA, int.etnia)}
                              {String(int.etnia) === '1' && int.puebloIndigena ? ` (${int.puebloIndigena})` : ''}
                            </td>
                          </tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Grupo Pob. Especial:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabels(GRUPO_POBLACIONAL, int.grupoPoblacional)}</td></tr>
                        </tbody>
                      </table>

                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          <tr><th className="font-bold py-0.5 w-2/5 border-b border-gray-100 print:text-[10px]">Peso / Talla:</th><td className="py-0.5 border-b border-gray-100 print:text-[10px]">{int.peso ? `${int.peso} kg` : '-'} / {int.talla ? `${int.talla} cm` : '-'}</td></tr>
                          <tr>
                            <th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">IMC / Obesidad:</th>
                            <td className="py-0.5 border-b border-gray-100 font-bold uppercase print:text-[10px]">
                              {(() => {
                                const res = calculateIMC(int.peso, int.talla);
                                return `${res.imc} (${res.clasificacion})`;
                              })()}
                            </td>
                          </tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">P. Braquial:</th><td className="py-0.5 border-b border-gray-100 print:text-[10px]">{int.perimetroBraquial ? `${int.perimetroBraquial} cm` : '-'}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Diag. Nutricional:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabel(DIAGNOSTICO_NUTRICIONAL, int.diagNutricional)}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Gestante:</th><td className="py-0.5 border-b border-gray-100 font-bold uppercase print:text-[10px]">{int.gestante || 'NO'}{int.gestante === 'SI' && int.mesesGestacion ? ` (${int.mesesGestacion} meses)` : ''}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Discapacidades:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabels(DISCAPACIDADES, int.discapacidades)}</td></tr>
                          <tr><th className="font-bold py-0.5 border-b border-gray-100 print:text-[10px]">Barreras de Acceso:</th><td className="py-0.5 border-b border-gray-100 uppercase print:text-[10px]">{getLabels(BARRERAS_ACCESO, int.barrerasAcceso)}</td></tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sub-bloques de salud */}
                    <div className="grid grid-cols-2 gap-x-6 mt-2.5 pt-2 border-t border-gray-200">
                      {/* Antecedentes & Signos Vitales */}
                      <div>
                        <p className="font-bold text-[#081e69] uppercase tracking-wider text-[10px] mb-1">Antecedentes & Signos Vitales</p>
                        <div className="space-y-0.5 text-[9.5px]">
                          <p className="text-gray-500 font-semibold uppercase">A. Crónicos: <span className="font-bold text-gray-800 text-black">
                            {(() => {
                              const list = parseMedicalHistoryList(int.antecedentes);
                              if (list.length === 0) return 'Ninguno';
                              let text = list.map(id => getLabel(ANTECEDENTES_CRONICOS, id)).join(', ');
                              if (list.includes('CA') && int.tipoCancer) {
                                text += ` (Tipo: ${int.tipoCancer})`;
                              }
                              return text;
                            })()}
                          </span></p>
                          <p className="text-gray-500 font-semibold uppercase">A. Transmisibles: <span className="font-bold text-gray-800 text-black">
                            {(() => {
                              const list = parseMedicalHistoryList(int.antecTransmisibles);
                              if (list.length === 0) return 'Ninguno';
                              return list.map(id => getLabel(ANTECEDENTES_TRANSMISIBLES, id)).join(', ');
                            })()}
                          </span></p>
                          <p className="text-gray-500 font-semibold uppercase">Presión Arterial: <span className="font-bold text-gray-800">{int.presionArterial || 'null'}</span></p>
                          <p className="text-gray-500 font-semibold uppercase">Frec. Cardíaca / Resp: <span className="font-bold text-gray-800">
                            {(int.frecuenciaCardiaca || int.frecuenciaRespiratoria) ? `${int.frecuenciaCardiaca || 'null'} lpm / ${int.frecuenciaRespiratoria || 'null'} rpm` : 'null'}
                          </span></p>
                          <p className="text-gray-500 font-semibold uppercase">Saturación SpO2: <span className="font-bold text-gray-800">{int.saturacionOxigeno ? `${int.saturacionOxigeno}%` : 'null'}</span></p>
                          
                          {/* Datos pediátricos (Perímetros cefálico y abdominal) */}
                          {(() => {
                            const ageVal = calculateAge(int.fechaNacimiento);
                            if (ageVal !== '-' && ageVal <= 5) {
                              return (
                                <>
                                  <p className="text-gray-500 font-semibold uppercase">P. Cefálico: <span className="font-bold text-gray-800">{int.perimetroCefalico ? `${int.perimetroCefalico} cm` : 'null'}</span></p>
                                  <p className="text-gray-500 font-semibold uppercase">P. Abdominal: <span className="font-bold text-gray-800">{int.perimetroAbdominal ? `${int.perimetroAbdominal} cm` : 'null'}</span></p>
                                </>
                              );
                            }
                            return null;
                          })()}

                          <p className="text-gray-500 font-semibold uppercase">Deporte / P&M / Vacunas: <span className="font-bold text-gray-800 text-black">
                            {`${int.practicaDeportiva ? 'Sí' : 'No'} / ${int.esquemaAtenciones ? 'Sí' : 'No'} / ${int.esquemaVacunacion ? 'Sí' : 'No'}`}
                          </span></p>

                          {/* Indicadores pediátricos OMS / Percentiles Z-Score */}
                          {(() => {
                            const ageVal = calculateAge(int.fechaNacimiento);
                            if (ageVal === '-' || ageVal >= 19 || !int.peso || !int.talla) return null;
                            const imcVal = int.peso / Math.pow(int.talla / 100, 2);
                            let medianImc = 15.2;
                            if (ageVal < 5) medianImc = 16.0 - (ageVal - 2) * 0.27;
                            else medianImc = 15.2 + (ageVal - 5) * 0.485;
                            const sd = 1.8;
                            const zScore = (imcVal - medianImc) / sd;
                            
                            let zScoreEval = 'Normal';
                            if (ageVal < 5) {
                              if (zScore < -2) zScoreEval = 'Delgadez [Z < -2]';
                              else if (zScore > 3) zScoreEval = 'Obesidad [Z > +3]';
                              else if (zScore > 2) zScoreEval = 'Sobrepeso [Z > +2]';
                              else if (zScore > 1) zScoreEval = 'Riesgo sobrepeso [Z > +1]';
                              else zScoreEval = 'Adecuado (Eutrófico)';
                            } else {
                              if (zScore < -2) zScoreEval = 'Delgadez [Z < -2]';
                              else if (zScore > 2) zScoreEval = 'Obesidad [Z > +2]';
                              else if (zScore > 1) zScoreEval = 'Sobrepeso [Z > +1]';
                              else zScoreEval = 'Adecuado (Eutrófico)';
                            }
                            return (
                              <div className="mt-1 p-1 bg-gray-50 border border-gray-200 rounded text-[8.5px]">
                                <p className="font-bold text-gray-700 uppercase mb-0.5">Indicadores OMS Z-Score</p>
                                <div className="grid grid-cols-2 gap-1 text-[8px] leading-tight">
                                  {ageVal < 10 && <p className="text-gray-500 font-medium">P/E: <span className="font-bold text-green-700">Normal (aprox)</span></p>}
                                  <p className="text-gray-500 font-medium">T/E: <span className="font-bold text-green-700">Adecuada</span></p>
                                  {ageVal < 5 && <p className="text-gray-500 font-medium">P/T: <span className="font-bold text-green-700">Eutrófico</span></p>}
                                  <p className="text-gray-500 font-medium col-span-2">IMC/E: <span className="font-bold text-emerald-700">{zScoreEval}</span></p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Exposición a Metales Pesados */}
                      <div>
                        <p className="font-bold text-[#081e69] uppercase tracking-wider text-[10px] mb-1">Exposición a Metales Pesados</p>
                        {int.riesgoMetalesPesados && int.riesgoMetalesPesados.aplicaExposicion ? (
                          <div className="space-y-0.5 text-[9.5px]">
                            <div className="flex items-center gap-1.5 text-gray-500 font-semibold uppercase">
                              Nivel de Riesgo: 
                              {(() => {
                                const calculated = getMetalRiskScoreText(int.riesgoMetalesPesados);
                                let colorCls = "bg-green-100 text-green-700 border-green-200";
                                if (calculated.value === 'ALTO') colorCls = "bg-red-100 text-red-700 border-red-200";
                                else if (calculated.value === 'MEDIO') colorCls = "bg-orange-100 text-orange-700 border-orange-200";
                                return (
                                  <span className={`px-1.5 py-0.2 rounded font-black text-[8.5px] border uppercase ${colorCls}`}>
                                    {calculated.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="text-gray-500 font-semibold uppercase">Ocupación expuesta: <span className="font-bold text-gray-800">{getLabel(OCUPACION, int.riesgoMetalesPesados.ocupacion).replace(/_/g, ' ')} {getOcupacionTiempoLabel(int.riesgoMetalesPesados.ocupacionTiempo)}</span></p>

                            {int.riesgoMetalesPesados.origenExposicion && (
                              <p className="text-gray-500 font-semibold uppercase">Origen / Causa Exposición: <span className="font-bold text-gray-800">{getLabels(ORIGEN_EXPOSICION_METALES, int.riesgoMetalesPesados.origenExposicion)}</span></p>
                            )}
                            <p className="text-gray-500 font-semibold uppercase">Continúa / Proteccion: <span className="font-bold text-gray-800">{int.riesgoMetalesPesados.continuaExpuesto || 'null'} / {int.riesgoMetalesPesados.utilizaEPP || 'null'}</span></p>
                            <p className="text-gray-500 font-semibold uppercase">Exp. Ambiental: <span className="font-bold text-gray-800">{String(int.riesgoMetalesPesados.ambiental).replace(/_/g, ' ')} {getAmbientalTiempoLabel(int.riesgoMetalesPesados.ambientalTiempo)}</span></p>
                            <p className="text-gray-500 font-semibold uppercase">Consumo Pescado: <span className="font-bold text-gray-800">{getPescadoLabel(int.riesgoMetalesPesados.pescado)}</span></p>
                            <p className="text-gray-500 font-semibold uppercase">Amalgamas: <span className="font-bold text-gray-800">{getAmalgamasLabel(int.riesgoMetalesPesados.amalgamas)}</span></p>
                            <p className="text-gray-500 font-semibold uppercase">Síntomas: <span className="font-bold text-gray-800">
                              {[...(int.riesgoMetalesPesados.sintomasNeu || []), ...(int.riesgoMetalesPesados.sintomasDig || []), ...(int.riesgoMetalesPesados.sintomasRen || []), ...(int.riesgoMetalesPesados.sintomasOtr || [])]
                                .map(s => String(s).replace(/_/g, ' ').toLowerCase())
                                .join(', ') || 'Ninguno'}
                            </span></p>
                            <p className="text-gray-500 font-semibold uppercase">Pruebas / Result: <span className="font-bold text-gray-800">{int.riesgoMetalesPesados.antecedentePrueba || 'null'} / {int.riesgoMetalesPesados.resultadoPrueba || 'null'}</span></p>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-gray-400 font-semibold uppercase italic">Integrante sin registros de exposición a metales pesados</p>
                        )}
                      </div>
                    </div>

                    {/* Intervenciones y Remisiones */}
                    <div className="grid grid-cols-2 gap-x-6 mt-2.5 pt-2 border-t border-dashed border-gray-200">
                      <div>
                        <p className="font-bold text-[#081e69] uppercase tracking-wider text-[10px] mb-1">Intervenciones Pendientes (P&M)</p>
                        <div className="space-y-0.5 text-[9.5px]">
                          <p className="text-gray-500 font-semibold uppercase">Acciones / Chequeos: <span className="font-bold text-gray-800 text-black">
                            {getLabels(INTERVENCIONES_PENDIENTES, int.intervencionesPendientes)}
                          </span></p>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-[#081e69] uppercase tracking-wider text-[10px] mb-1">Enfermedad Aguda & Remisiones</p>
                        <div className="space-y-0.5 text-[9.5px]">
                          <p className="text-gray-500 font-semibold uppercase">Enfermedad Aguda (último mes): <span className="font-bold text-gray-800 text-black">
                            {int.enfermedadAguda ? `SÍ ${int.recibeAtencionMedica ? '(Recibe atención médica)' : '(No recibe atención médica)'}` : 'NO'}
                          </span></p>
                          <p className="text-gray-500 font-semibold uppercase">Remisiones recomendadas: <span className="font-bold text-gray-800 text-black">
                            {getLabels(REMISIONES_SISTEMA, int.remisiones)}
                          </span></p>
                        </div>
                      </div>
                    </div>

                    {/* Atenciones del integrante */}
                    {int.atenciones && int.atenciones.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-dashed border-gray-200 bg-gray-50/50 rounded p-3">
                         <div className="flex items-center gap-2 mb-2">
                           <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#081e69]">Historial de Atenciones Personal</h4>
                           <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Total: {int.atenciones.length}</span>
                         </div>
                         <table className="w-full text-left text-[10px] border-collapse bg-white border border-gray-200">
                           <thead>
                             <tr className="bg-gray-100 text-gray-600">
                               <th className="border-b border-gray-200 py-1 px-2 font-bold uppercase text-[8px]">Fecha / Programa</th>
                               <th className="border-b border-gray-200 py-1 px-2 font-bold uppercase text-[8px]">Profesional</th>
                               <th className="border-b border-gray-200 py-1 px-2 font-bold uppercase text-[8px]">Motivo / Nota</th>
                             </tr>
                           </thead>
                           <tbody>
                             {int.atenciones
                               .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                               .map((at: any) => (
                               <tr key={at.id}>
                                 <td className="py-1 px-2 border-b border-gray-100 align-top">
                                   <div className="font-bold">{new Date(at.createdAt).toLocaleDateString('es-CO')}</div>
                                   <div className="text-gray-500 font-medium text-[8px] uppercase">{at.programa?.nombre}</div>
                                 </td>
                                 <td className="py-1 px-2 border-b border-gray-100 align-top font-semibold text-gray-700">
                                   {at.profesional?.nombre} {at.profesional?.apellidos}
                                 </td>
                                 <td className="py-1 px-2 border-b border-gray-100 align-top italic text-gray-600">
                                   &quot;{at.motivo || at.nota || 'Consulta registrada'}&quot;
                                 </td>
                                </tr>
                             ))}
                           </tbody>
                         </table>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="italic text-gray-500 text-center py-4 border border-dashed border-gray-300">No hay integrantes registrados en esta visita.</p>
            )}
          </div>

          {/* SECCIÓN FINAL: Autorizaciones, Firmas y Seguimientos */}
          <div className="mt-6 pt-4 border-t-2 border-black print:break-inside-avoid">
            {/* AUTORIZACIÓN Y FIRMA (SECCIÓN 11) */}
            {ficha.consentimiento && (
              <div className="border border-gray-300 rounded-xl p-4 bg-gray-50/50 print:break-inside-avoid mb-6">
                <h3 className="font-bold text-[#081e69] uppercase text-xs tracking-wider border-b pb-1.5 mb-2 border-gray-200">
                  11. Autorización de Datos y Firma Electrónica
                </h3>
                <div className="grid grid-cols-2 gap-8 text-xs">
                  <div className="space-y-1.5">
                    <p><strong className="text-gray-500 uppercase text-[9px]">Estado de Consentimiento:</strong></p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold border border-green-200 text-[10px]">
                      ✓ AUTORIZADO (Ley 1581 de 2012)
                    </div>
                    <p className="text-gray-700 leading-snug text-[11px] mt-2">
                      El titular autorizó de manera libre, previa, expresa e informada el tratamiento de sus datos personales y de salud para fines asistenciales, epidemiológicos y de seguimiento en salud.
                    </p>
                    <div className="text-[9px] text-gray-400 mt-2 space-y-0.5 font-mono">
                      <p>Fecha Consentimiento: {new Date((ficha.consentimiento as any).fecha).toLocaleString('es-CO')}</p>
                      <p>IP Registro: {(ficha.consentimiento as any).ip || 'Local'} · Versión: {(ficha.consentimiento as any).version_autorizacion || '1.0'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-3 bg-white">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Firma del Titular / Informante</p>
                    {(ficha.consentimiento as any).firma ? (
                      <img 
                        src={(ficha.consentimiento as any).firma} 
                        alt="Firma electrónica" 
                        className="max-h-[60px] object-contain" 
                      />
                    ) : (
                      <div className="h-[60px] flex items-center justify-center text-gray-300 italic text-[10px]">Sin firma registrada</div>
                    )}
                    <div className="w-full border-t mt-3 pt-2 text-center text-[10px]">
                      <p className="font-bold text-gray-800">{(ficha.consentimiento as any).nombre}</p>
                      <p className="text-gray-500">C.C. {(ficha.consentimiento as any).identificacion}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORIAL DE SEGUIMIENTOS (SECCIÓN 12) */}
            {ficha.seguimientos && ficha.seguimientos.length > 0 && (
              <div className="mb-8">
                <h2 className={headerCls}>12. Historial de Seguimientos Familiares</h2>
                <div className="space-y-4">
                  {ficha.seguimientos.map((seg: any) => (
                    <div key={seg.id} className="border-b border-gray-200 pb-3 last:border-0 print:break-inside-avoid">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold bg-gray-200 text-gray-800 text-[10px] px-1.5 py-0.5 rounded uppercase">
                          Seguimiento N° {seg.consecutivo}
                        </span>
                        <span className="font-bold text-xs text-gray-800">
                          {new Date(seg.createdAt || seg.fecha).toLocaleDateString('es-CO')}
                        </span>
                        <span className="text-[9px] font-black uppercase text-gray-500">
                          - Resp: {seg.responsable?.nombre} {seg.responsable?.apellidos}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 italic">
                        &quot;{seg.observacion}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
    </>
  )
}
