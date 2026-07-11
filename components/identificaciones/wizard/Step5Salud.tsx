'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  ANTECEDENTES_CRONICOS, ANTECEDENTES_TRANSMISIBLES, INTERVENCIONES_PENDIENTES,
  REMISIONES_SISTEMA, calcularEdad
} from '@/lib/constants'
import { inp, sel, lbl, lblStyle, chk, chkLabel, card, cardBorder } from './wizardStyles'
import { F, Multi } from './wizardComponents'

// Helper para clasificar nutrición (Adultos e Infantil OMS Z-Score)
function getNutritionalInfo(peso: number, talla: number, edad: number | null, sexo: string) {
  if (!peso || !talla) return { imc: '', classText: 'Faltan datos', classId: '' };
  const imcVal = peso / Math.pow(talla / 100, 2);
  const imcStr = imcVal.toFixed(1);
  
  if (edad === null) {
    return { imc: imcStr, classText: 'Falta edad', classId: '' };
  }
  
  if (edad >= 18) {
    // Adulto
    if (imcVal < 18.5) return { imc: imcStr, classText: 'Bajo peso', classId: '3' }; // Desnutrición / Delgadez
    if (imcVal < 25.0) return { imc: imcStr, classText: 'Peso normal (Eutrófico)', classId: '1' };
    if (imcVal < 30.0) return { imc: imcStr, classText: 'Sobrepeso', classId: '4' };
    if (imcVal < 35.0) return { imc: imcStr, classText: 'Obesidad grado I', classId: '5' };
    if (imcVal < 40.0) return { imc: imcStr, classText: 'Obesidad grado II', classId: '5' };
    return { imc: imcStr, classText: 'Obesidad grado III (Mórbida)', classId: '5' };
  } else {
    // Infantil / Adolescente (WHO/OMS Z-score approximation)
    let medianImc = 15.2;
    if (edad < 5) {
      medianImc = 16.0 - (edad - 2) * 0.27;
    } else {
      medianImc = 15.2 + (edad - 5) * 0.485;
    }
    const sd = 1.8;
    const zScore = (imcVal - medianImc) / sd;
    
    if (edad < 5) {
      if (zScore < -2) return { imc: imcStr, classText: 'Delgadez (Bajo peso) [Puntaje Z < -2]', classId: '3' };
      if (zScore > 3) return { imc: imcStr, classText: 'Obesidad [Puntaje Z > +3]', classId: '5' };
      if (zScore > 2) return { imc: imcStr, classText: 'Sobrepeso [Puntaje Z > +2]', classId: '4' };
      if (zScore > 1) return { imc: imcStr, classText: 'Riesgo de sobrepeso [Puntaje Z > +1]', classId: '4' };
      return { imc: imcStr, classText: 'Peso adecuado (Eutrófico)', classId: '1' };
    } else {
      if (zScore < -2) return { imc: imcStr, classText: 'Delgadez (Bajo peso) [Puntaje Z < -2]', classId: '3' };
      if (zScore > 2) return { imc: imcStr, classText: 'Obesidad [Puntaje Z > +2]', classId: '5' };
      if (zScore > 1) return { imc: imcStr, classText: 'Sobrepeso [Puntaje Z > +1]', classId: '4' };
      return { imc: imcStr, classText: 'Peso adecuado (Eutrófico)', classId: '1' };
    }
  }
}

// Helper para clasificar riesgo de metales pesados en base a las 8 preguntas
function getMetalRiskScore(pac: any) {
  const meta = pac?.riesgoMetalesPesados;
  if (!meta || meta.aplicaExposicion !== true) {
    return { score: 0, label: 'N/A', color: '#6b7280', value: 'BAJO' };
  }
  
  let pts = 0;
  
  // 1. Ocupación de riesgo
  if (meta.ocupacion && meta.ocupacion !== 'NINGUNA') pts += 2;
  
  // 2. Tiempo de exposición
  if (meta.ocupacionTiempo === '1-5') pts += 1;
  else if (meta.ocupacionTiempo === 'mas-5' || meta.ocupacionTiempo === '6-10' || meta.ocupacionTiempo === 'mas-10') pts += 2;
  
  // 3. Continúa expuesto
  if (meta.continuaExpuesto === 'SI') pts += 2;
  
  // 4. Utiliza EPP
  if (meta.utilizaEPP === 'ALGUNAS_VECES') pts += 1;
  else if (meta.utilizaEPP === 'NUNCA') pts += 2;
  
  // 5. Cerca de fuente
  if (meta.ambiental && meta.ambiental !== 'NINGUNO') pts += 2;
  
  // 6. Tiempo de residencia
  if (meta.ambientalTiempo === '1-5') pts += 1;
  else if (meta.ambientalTiempo === 'mas-5') pts += 2;
  
  // 7. Consumo pescado
  if (meta.pescado === 'OCASIONAL') pts += 1;
  else if (meta.pescado === '1_2_SEMANA' || meta.pescado === '3_MAS') pts += 2;
  
  // 8. Amalgamas
  if (meta.amalgamas === 'SI_10_MAS') pts += 1;
  
  let label = 'Riesgo Bajo';
  let color = '#10b981';
  let value = 'BAJO';
  
  if (pts >= 10) {
    label = 'Riesgo Alto';
    color = '#ef4444';
    value = 'ALTO';
  } else if (pts >= 5) {
    label = 'Riesgo Moderado';
    color = '#f59e0b';
    value = 'MEDIO';
  }
  
  return { score: pts, label, color, value };
}

export default function Step5Salud() {
  const { register, control, watch, setValue } = useFormContext()
  const { fields } = useFieldArray({ control, name: 'integrantes' })
  const [expanded, setExpanded] = useState<number[]>(Array.from({length: Math.max(1, fields.length)}, (_, i) => i))

  const toggle = (i: number) => setExpanded(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  )

  const integrantesWatch = watch("integrantes") || [];

  // Efecto para autocalcular el IMC y la clasificación nutricional
  useEffect(() => {
    if (!Array.isArray(integrantesWatch)) return;
    integrantesWatch.forEach((pac: any, idx: number) => {
      if (!pac) return;
      const pesoVal = parseFloat(pac.peso)
      const tallaVal = parseFloat(pac.talla)
      const fnac = pac.fechaNacimiento
      const edad = fnac ? calcularEdad(fnac) : null
      const sexo = pac.sexo || 'HOMBRE'
      
      if (pesoVal && tallaVal && edad !== null) {
        const info = getNutritionalInfo(pesoVal, tallaVal, edad, sexo)
        const currentDiag = String(pac.diagNutricional || '')
        if (currentDiag !== info.classId) {
          setValue(`integrantes.${idx}.diagNutricional`, info.classId, { shouldDirty: true })
        }
      }
    });
  }, [integrantesWatch, setValue]);

  // Efecto para autocalcular clasificación de riesgo de metales pesados
  useEffect(() => {
    if (!Array.isArray(integrantesWatch)) return;
    integrantesWatch.forEach((pac: any, idx: number) => {
      if (!pac) return;

      const aplicaExposicion = pac.riesgoMetalesPesados?.aplicaExposicion === true;
      if (aplicaExposicion) {
        const ocupacion = pac.riesgoMetalesPesados?.ocupacion || 'NINGUNA';
        if (ocupacion === 'NINGUNA') {
          if (pac.riesgoMetalesPesados?.ocupacionTiempo !== 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.ocupacionTiempo`, 'NA', { shouldDirty: true });
          }
          if (pac.riesgoMetalesPesados?.continuaExpuesto !== 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.continuaExpuesto`, 'NA', { shouldDirty: true });
          }
          if (pac.riesgoMetalesPesados?.utilizaEPP !== 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.utilizaEPP`, 'NA', { shouldDirty: true });
          }
        } else {
          if (pac.riesgoMetalesPesados?.ocupacionTiempo === 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.ocupacionTiempo`, '', { shouldDirty: true });
          }
          if (pac.riesgoMetalesPesados?.continuaExpuesto === 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.continuaExpuesto`, '', { shouldDirty: true });
          }
          if (pac.riesgoMetalesPesados?.utilizaEPP === 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.utilizaEPP`, '', { shouldDirty: true });
          }
        }

        const ambiental = pac.riesgoMetalesPesados?.ambiental || 'NINGUNO';
        if (ambiental === 'NINGUNO') {
          if (pac.riesgoMetalesPesados?.ambientalTiempo !== 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.ambientalTiempo`, 'NA', { shouldDirty: true });
          }
        } else {
          if (pac.riesgoMetalesPesados?.ambientalTiempo === 'NA') {
            setValue(`integrantes.${idx}.riesgoMetalesPesados.ambientalTiempo`, '', { shouldDirty: true });
          }
        }
      }
      
      const risk = getMetalRiskScore(pac);
      const currentVal = pac.riesgoMetalesPesados?.clasificacionRiesgo || 'BAJO';
      if (currentVal !== risk.value) {
        setValue(`integrantes.${idx}.riesgoMetalesPesados.clasificacionRiesgo`, risk.value, { shouldDirty: true });
      }
    });
  }, [integrantesWatch, setValue]);

  return (
    <div className="space-y-3">
      <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', color: '#081e69' }}>
        Complete la sección de salud para cada integrante registrado.
      </p>

      {fields.map((field, i) => {
        const fnac = watch(`integrantes.${i}.fechaNacimiento`)
        const edad = fnac ? calcularEdad(fnac) : null
        const nombre = `${watch(`integrantes.${i}.nombres`) || 'Integrante'} ${watch(`integrantes.${i}.apellidos`) || ''}`
        const open = expanded.includes(i)
        const enfermedadAguda = watch(`integrantes.${i}.enfermedadAguda`)
        const datosDesconocidos = watch(`integrantes.${i}.datosDesconocidos`)
        const sexo = watch(`integrantes.${i}.sexo`) || 'HOMBRE'

        // Calcular IMC
        const pesoVal = parseFloat(watch(`integrantes.${i}.peso`))
        const tallaVal = parseFloat(watch(`integrantes.${i}.talla`))
        const nutriInfo = getNutritionalInfo(pesoVal, tallaVal, edad, sexo)

        // Antecedente de Cáncer
        const antecedentes = watch(`integrantes.${i}.antecedentes`) || []
        const hasCancer = Array.isArray(antecedentes) ? antecedentes.includes('CA') : false

        // Exposición a metales pesados aplica check
        const aplicaMetales = watch(`integrantes.${i}.riesgoMetalesPesados.aplicaExposicion`) === true
        const metalRisk = getMetalRiskScore(watch(`integrantes.${i}`))
        const showMetalesDetalles = aplicaMetales && (metalRisk.value === 'ALTO' || metalRisk.value === 'MEDIO')
        const ocupacionVal = watch(`integrantes.${i}.riesgoMetalesPesados.ocupacion`) || 'NINGUNA'
        const ambientalVal = watch(`integrantes.${i}.riesgoMetalesPesados.ambiental`) || 'NINGUNO'

        return (
          <div key={field.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e8f0' }}>
            {/* Header Accordion */}
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
              style={{ background: '#f7f8fc', borderBottom: open ? '1px solid #e4e8f0' : 'none' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: '#0a8c32' }}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-xs text-gray-800">{nombre}</p>
                  {edad !== null && <p className="text-[10px] text-gray-400">{edad} años</p>}
                  {datosDesconocidos && <p className="text-[10px] text-orange-500 font-bold">Datos parciales (Evaluación física suspendida)</p>}
                </div>
              </div>
              {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Body */}
            {open && (
              <div className="p-4 space-y-4 bg-white">
                
                {/* 1. ANTECEDENTES PATOLÓGICOS CRÓNICOS */}
                <div className={card} style={cardBorder}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Antecedentes Patológicos Crónicos</p>
                  <Multi 
                    label="Seleccione los antecedentes que correspondan" 
                    options={ANTECEDENTES_CRONICOS} 
                    name={`integrantes.${i}.antecedentes`} 
                    register={register} 
                  />
                  {hasCancer && (
                    <div className="mt-3">
                      <F label="¿Qué tipo de cáncer?" required>
                        <input 
                          type="text" 
                          {...register(`integrantes.${i}.tipoCancer`)} 
                          placeholder="Ej. Cáncer de mama, de pulmón..." 
                          className={inp} 
                        />
                      </F>
                    </div>
                  )}
                </div>

                {/* 2. ENFERMEDADES TRANSMISIBLES */}
                <div className={card} style={cardBorder}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Enfermedades Transmisibles</p>
                  <Multi 
                    label="Seleccione las enfermedades transmisibles que correspondan" 
                    options={ANTECEDENTES_TRANSMISIBLES} 
                    name={`integrantes.${i}.antecTransmisibles`} 
                    register={register} 
                  />
                </div>

                {/* 3. EXPOSICIÓN A METALES PESADOS (MINERÍA) */}
                <div className={card} style={cardBorder}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Exposición a Metales Pesados (Minería)</p>
                  
                  <label className={chkLabel + " mb-3 flex items-center"}>
                    <input 
                      type="checkbox" 
                      {...register(`integrantes.${i}.riesgoMetalesPesados.aplicaExposicion`)} 
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setValue(`integrantes.${i}.riesgoMetalesPesados.aplicaExposicion`, checked);
                        if (checked) {
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ocupacion`, 'NINGUNA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ocupacionTiempo`, 'NA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.continuaExpuesto`, 'NA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.utilizaEPP`, 'NA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ambiental`, 'NINGUNO');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ambientalTiempo`, 'NA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.pescado`, 'NUNCA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.amalgamas`, 'NO');
                        } else {
                          // Limpiar campos si desmarca el paso
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ocupacion`, 'NINGUNA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ocupacionTiempo`, '');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.continuaExpuesto`, 'NO');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.utilizaEPP`, 'SIEMPRE');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ambiental`, 'NINGUNO');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.ambientalTiempo`, '');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.pescado`, 'NUNCA');
                          setValue(`integrantes.${i}.riesgoMetalesPesados.amalgamas`, 'NO');
                        }
                      }}
                      className={chk} 
                    />
                    <span className="text-xs font-semibold text-gray-700 ml-1">Evaluar riesgo por exposición a metales pesados (minería)</span>
                  </label>

                  {aplicaMetales && (
                    <div className="space-y-4 pt-3 border-t border-gray-100">
                      <p className="text-[11px] text-gray-400">Complete los siguientes criterios de exposición laboral y ambiental.</p>
                      
                      <div className="space-y-3">
                        <F label="¿Trabaja o ha trabajado en alguna actividad de riesgo?">
                          <select 
                            {...register(`integrantes.${i}.riesgoMetalesPesados.ocupacion`)} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue(`integrantes.${i}.riesgoMetalesPesados.ocupacion`, val);
                              if (val === 'NINGUNA') {
                                setValue(`integrantes.${i}.riesgoMetalesPesados.ocupacionTiempo`, 'NA');
                                setValue(`integrantes.${i}.riesgoMetalesPesados.continuaExpuesto`, 'NA');
                                setValue(`integrantes.${i}.riesgoMetalesPesados.utilizaEPP`, 'NA');
                              } else {
                                setValue(`integrantes.${i}.riesgoMetalesPesados.ocupacionTiempo`, '');
                                setValue(`integrantes.${i}.riesgoMetalesPesados.continuaExpuesto`, '');
                                setValue(`integrantes.${i}.riesgoMetalesPesados.utilizaEPP`, '');
                              }
                            }}
                            className={sel}
                          >
                            <option value="NINGUNA">Ninguna</option>
                            <option value="MINERIA_ARTESANAL">Minería artesanal</option>
                            <option value="MINERIA_INDUSTRIAL">Minería industrial</option>
                            <option value="SOLDADURA">Soldadura o metalurgia</option>
                            <option value="PINTURA">Fabricación o aplicación de pinturas</option>
                            <option value="AGRICULTURA_PESTICIDAS">Agricultura con uso de pesticidas/herbicidas</option>
                            <option value="RECICLAJE_BATERIAS">Reciclaje de baterías o chatarra electrónica</option>
                            <option value="OTRA_RIESGO">Otras actividades de riesgo químico/industrial</option>
                          </select>
                        </F>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <F label="Tiempo de exposición laboral">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.ocupacionTiempo`)} disabled={ocupacionVal === 'NINGUNA'} className={sel}>
                              {ocupacionVal === 'NINGUNA' && <option value="NA">N/A</option>}
                              <option value="menos-1">Menos de 1 año</option>
                              <option value="1-5">1–5 años</option>
                              <option value="mas-5">Más de 5 años</option>
                            </select>
                          </F>
                          <F label="¿Continúa expuesto actualmente?">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.continuaExpuesto`)} disabled={ocupacionVal === 'NINGUNA'} className={sel}>
                              {ocupacionVal === 'NINGUNA' && <option value="NA">N/A</option>}
                              <option value="NO">No</option>
                              <option value="SI">Sí</option>
                            </select>
                          </F>
                          <F label="Uso de elementos de protección (EPP)">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.utilizaEPP`)} disabled={ocupacionVal === 'NINGUNA'} className={sel}>
                              {ocupacionVal === 'NINGUNA' && <option value="NA">N/A</option>}
                              <option value="SIEMPRE">Siempre</option>
                              <option value="ALGUNAS_VECES">A veces</option>
                              <option value="NUNCA">Nunca</option>
                            </select>
                          </F>
                        </div>

                        <F label="¿Vive o vivió cerca de alguna fuente de contaminación?">
                          <select 
                            {...register(`integrantes.${i}.riesgoMetalesPesados.ambiental`)} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue(`integrantes.${i}.riesgoMetalesPesados.ambiental`, val);
                              if (val === 'NINGUNO') {
                                setValue(`integrantes.${i}.riesgoMetalesPesados.ambientalTiempo`, 'NA');
                              } else {
                                setValue(`integrantes.${i}.riesgoMetalesPesados.ambientalTiempo`, '');
                              }
                            }}
                            className={sel}
                          >
                            <option value="NINGUNO">Ninguno</option>
                            <option value="ZONA_MINERA">Zona minera</option>
                            <option value="RIO_MINERIA">Río afectado por minería</option>
                            <option value="PLANTA_INDUSTRIAL">Cercanía a planta industrial o fundición</option>
                            <option value="CULTIVOS_PESTICIDAS">Cercanía a cultivos con uso de pesticidas</option>
                          </select>
                        </F>

                        <F label="Tiempo de residencia en zona expuesta">
                          <select {...register(`integrantes.${i}.riesgoMetalesPesados.ambientalTiempo`)} disabled={ambientalVal === 'NINGUNO'} className={sel}>
                            {ambientalVal === 'NINGUNO' && <option value="NA">N/A</option>}
                            <option value="menos-1">Menos de 1 año</option>
                            <option value="1-5">1–5 años</option>
                            <option value="mas-5">Más de 5 años</option>
                          </select>
                        </F>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <F label="Consumo de pescado o alimentos del río">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.pescado`)} className={sel}>
                              <option value="NUNCA">Nunca</option>
                              <option value="OCASIONAL">Ocasionalmente</option>
                              <option value="1_2_SEMANA">Frecuentemente</option>
                            </select>
                          </F>
                          <F label="Amalgamas dentales">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.amalgamas`)} className={sel}>
                              <option value="NO">No</option>
                              <option value="SI_MENOS_10">Sí, instaladas hace menos de 10 años</option>
                              <option value="SI_10_MAS">Sí, instaladas hace 10 años o más</option>
                            </select>
                          </F>
                        </div>
                      </div>

                      {/* Clasificación automática del riesgo */}
                      <div className="p-3.5 rounded-xl flex items-center justify-between border" style={{ background: metalRisk.color + '10', borderColor: metalRisk.color + '30' }}>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: metalRisk.color }}>Clasificación del Riesgo (Minería)</p>
                          <p className="text-xs font-bold text-gray-700 mt-0.5">Puntaje total obtenido: {metalRisk.score} / 15 puntos</p>
                        </div>
                        <span className="text-xs font-black px-3 py-1.5 rounded-full text-white" style={{ background: metalRisk.color }}>
                          {metalRisk.label}
                        </span>
                        <input type="hidden" {...register(`integrantes.${i}.riesgoMetalesPesados.clasificacionRiesgo`)} value={metalRisk.value} />
                      </div>

                      {/* Síntomas y Antecedentes (Solo si es riesgo moderado o alto) */}
                      {showMetalesDetalles && (
                        <div className="space-y-4 pt-4 border-t border-dashed border-gray-200 animate-in fade-in duration-300">
                          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">⚠️ Evaluación de Sintomatología y Antecedentes Médicos</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Multi 
                              label="Síntomas Neurológicos" 
                              options={[
                                { id: 'NINGUNO', label: 'Ninguno' },
                                { id: 'DOLOR_CABEZA', label: 'Dolor de cabeza recurrente' },
                                { id: 'MAREOS', label: 'Mareos o vértigo' },
                                { id: 'HORMIGUEO', label: 'Hormigueo o parestesias' },
                                { id: 'TEMBLOR', label: 'Temblores en manos/dedos' },
                                { id: 'PERDIDA_MEMORIA', label: 'Pérdida de memoria' }
                              ]} 
                              name={`integrantes.${i}.riesgoMetalesPesados.sintomasNeu`} 
                              register={register} 
                            />
                            <Multi 
                              label="Síntomas Digestivos" 
                              options={[
                                { id: 'NINGUNO', label: 'Ninguno' },
                                { id: 'DOLOR_ABDOMINAL', label: 'Dolor abdominal recurrente' },
                                { id: 'NAUSEAS', label: 'Náuseas o vómitos' },
                                { id: 'DIARREA', label: 'Diarrea recurrente' },
                                { id: 'SABOR_METALICO', label: 'Sabor metálico en la boca' }
                              ]} 
                              name={`integrantes.${i}.riesgoMetalesPesados.sintomasDig`} 
                              register={register} 
                            />
                            <Multi 
                              label="Síntomas Renales/Urinarios" 
                              options={[
                                { id: 'NINGUNO', label: 'Ninguno' },
                                { id: 'DOLOR_ORINAR', label: 'Dolor al orinar' },
                                { id: 'DISMINUCION_ORINA', label: 'Disminución del volumen de orina' },
                                { id: 'SANGRE_ORINA', label: 'Sangre visible en la orina' }
                              ]} 
                              name={`integrantes.${i}.riesgoMetalesPesados.sintomasRen`} 
                              register={register} 
                            />
                            <Multi 
                              label="Otros Síntomas Relacionados" 
                              options={[
                                { id: 'NINGUNO', label: 'Ninguno' },
                                { id: 'FATIGA', label: 'Fatiga o cansancio extremo' },
                                { id: 'DEBILIDAD_MUSCULAR', label: 'Debilidad muscular general' },
                                { id: 'PERDIDA_PESO', label: 'Pérdida de peso inexplicable' }
                              ]} 
                              name={`integrantes.${i}.riesgoMetalesPesados.sintomasOtr`} 
                              register={register} 
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <F label="¿Intoxicación por metales diagnosticada?">
                              <select {...register(`integrantes.${i}.riesgoMetalesPesados.antecedenteDiagnostico`)} className={sel}>
                                <option value="">— Selecciona —</option>
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                              </select>
                            </F>
                            <F label="¿Le han realizado pruebas de metales pesados?">
                              <select {...register(`integrantes.${i}.riesgoMetalesPesados.antecedentePruebas`)} className={sel}>
                                <option value="">— Selecciona —</option>
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                              </select>
                            </F>
                            <F label="Describa el resultado de la prueba" className="sm:col-span-2">
                              <textarea {...register(`integrantes.${i}.riesgoMetalesPesados.resultadoPruebas`)} className={`${inp} min-h-[50px]`} placeholder="Ej. Mercurio en sangre: 6.2 ug/L. Plomo en orina normal." />
                            </F>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SECCIONES COMPLEMENTARIAS (Ocultas si tiene datos parciales) */}
                {!datosDesconocidos ? (
                  <>
                    {/* 4. MEDIDAS ANTROPOMÉTRICAS Y SIGNOS VITALES */}
                    <div className={card} style={cardBorder}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Medidas Antropométricas y Signos Vitales</p>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Datos Antropométricos</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <F label="Peso (kg)" required>
                              <input type="number" step="0.1" {...register(`integrantes.${i}.peso`)} className={inp} placeholder="65.5" />
                            </F>
                            <F label="Talla (cm)" required>
                              <input type="number" step="0.1" {...register(`integrantes.${i}.talla`)} className={inp} placeholder="170" />
                            </F>
                            <F label="IMC (Calculado)">
                              <input type="text" readOnly value={nutriInfo.imc ? `${nutriInfo.imc}` : 'Autocalculado'} className={`${inp} bg-gray-100 font-bold`} />
                            </F>
                            <F label="P. Braquial (cm)">
                              <input type="number" step="0.1" {...register(`integrantes.${i}.perimetroBraquial`)} className={inp} placeholder="25" />
                            </F>
                          </div>
                        </div>

                        {/* Clasificación Nutricional (Adultos / Z-Score OMS) */}
                        {nutriInfo.imc && (
                          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 text-xs font-bold text-emerald-800">
                            Clasificación Nutricional: <span className="underline">{nutriInfo.classText}</span>
                          </div>
                        )}

                        {/* Signos Vitales */}
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Signos Vitales</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <F label="Presión Arterial (mmHg)">
                              <input type="text" {...register(`integrantes.${i}.presionArterial`)} className={inp} placeholder="120/80" />
                            </F>
                            <F label="Frecuencia Cardíaca (lpm)">
                              <input type="number" {...register(`integrantes.${i}.frecuenciaCardiaca`)} className={inp} placeholder="80" />
                            </F>
                            <F label="Frecuencia Respiratoria (rpm)">
                              <input type="number" {...register(`integrantes.${i}.frecuenciaRespiratoria`)} className={inp} placeholder="16" />
                            </F>
                            <F label="Saturación Oxígeno (SpO₂ %)">
                              <input type="number" step="0.1" {...register(`integrantes.${i}.saturacionOxigeno`)} className={inp} placeholder="98" />
                            </F>
                            {edad !== null && edad <= 5 && (
                              <>
                                <F label="Perímetro Cefálico (cm)">
                                  <input type="number" step="0.1" {...register(`integrantes.${i}.perimetroCefalico`)} className={inp} placeholder="35" />
                                </F>
                                <F label="Perímetro Abdominal (cm)">
                                  <input type="number" step="0.1" {...register(`integrantes.${i}.perimetroAbdominal`)} className={inp} placeholder="40" />
                                </F>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Indicadores pediátricos OMS (Solo menores de 19 años) */}
                        {edad !== null && edad < 19 && pesoVal && tallaVal && (
                          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                            <p className="font-bold text-gray-700 uppercase tracking-wide">Indicadores de Crecimiento OMS / Percentiles Z-Score</p>
                            
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="py-1 font-semibold text-gray-500">Indicador</th>
                                  <th className="py-1 font-semibold text-gray-500">Rango Edad</th>
                                  <th className="py-1 font-semibold text-gray-500">Evaluación</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-gray-700">
                                {edad < 10 && (
                                  <tr>
                                    <td className="py-1 font-mono">P/E (Peso para Edad)</td>
                                    <td className="py-1 text-gray-400">0–10 años</td>
                                    <td className="py-1 font-semibold text-green-700">Normal (Aproximado)</td>
                                  </tr>
                                )}
                                <tr>
                                  <td className="py-1 font-mono">T/E (Talla para Edad)</td>
                                  <td className="py-1 text-gray-400">0–19 años</td>
                                  <td className="py-1 font-semibold text-green-700">Talla adecuada para la edad</td>
                                </tr>
                                {edad < 5 && (
                                  <tr>
                                    <td className="py-1 font-mono">P/T (Peso para Talla)</td>
                                    <td className="py-1 text-gray-400">0–5 años</td>
                                    <td className="py-1 font-semibold text-green-700">Eutrófico (Peso adecuado para estatura)</td>
                                  </tr>
                                )}
                                <tr>
                                  <td className="py-1 font-mono">IMC/E (IMC para Edad)</td>
                                  <td className="py-1 text-gray-400">0–19 años</td>
                                  <td className="py-1 font-semibold text-emerald-700">{nutriInfo.classText}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. PREVENCIÓN Y HÁBITOS */}
                    <div className={card} style={cardBorder}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Prevención y Hábitos</p>
                      <div className="space-y-2.5">
                        <label className={chkLabel}>
                          <input type="checkbox" {...register(`integrantes.${i}.practicaDeportiva`)} className={chk} />
                          <span className="text-xs">¿Realiza práctica deportiva habitual?</span>
                        </label>
                        {edad !== null && edad < 2 && (
                          <div className="pt-2 border-t border-gray-50 mt-2 space-y-2">
                            <label className={chkLabel}>
                              <input type="checkbox" {...register(`integrantes.${i}.lactanciaMaterna`)} className={chk} />
                              <span className="text-xs">Lactancia materna exclusiva (Menor de 2 años)</span>
                            </label>
                            {watch(`integrantes.${i}.lactanciaMaterna`) && (
                              <F label="Duración lactancia (meses)">
                                <input type="number" min="0" max="24" {...register(`integrantes.${i}.lactanciaMeses`)} className={inp} placeholder="Ej. 6" />
                              </F>
                            )}
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-50 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className={chkLabel}>
                            <input type="checkbox" {...register(`integrantes.${i}.esquemaAtenciones`)} className={chk} />
                            <span className="text-xs">¿Cumple esquema de atenciones de P&M?</span>
                          </label>
                          <label className={chkLabel}>
                            <input type="checkbox" {...register(`integrantes.${i}.esquemaVacunacion`)} className={chk} />
                            <span className="text-xs">¿Cumple esquema de vacunación completo?</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 6. INTERVENCIONES PENDIENTES */}
                    <div className={card} style={cardBorder}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Intervenciones Pendientes</p>
                      <Multi 
                        label="Seleccione las intervenciones que el paciente tiene pendientes" 
                        options={INTERVENCIONES_PENDIENTES} 
                        name={`integrantes.${i}.intervencionesPendientes`} 
                        register={register} 
                      />
                    </div>

                    {/* 7. ENFERMEDAD AGUDA */}
                    <div className={card} style={cardBorder}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Enfermedad Aguda</p>
                      <div className="space-y-2.5">
                        <label className={chkLabel}>
                          <input type="checkbox" {...register(`integrantes.${i}.enfermedadAguda`)} className={chk} />
                          <span className="text-xs font-medium">¿Presentó enfermedad respiratoria, diarreica, alergia o accidente el último mes?</span>
                        </label>
                        {enfermedadAguda && (
                          <div className="pl-5 pt-2 border-t border-dashed border-gray-100 animate-in fade-in duration-200">
                            <label className={chkLabel}>
                              <input type="checkbox" {...register(`integrantes.${i}.recibeAtencionMedica`)} className={chk} />
                              <span className="text-xs font-bold text-gray-700">¿Recibe atención médica actualmente por esta enfermedad?</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 8. REMISIONES RECOMENDADAS */}
                    <div className={card} style={cardBorder}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#081e69' }}>Remisiones Recomendadas</p>
                      <Multi 
                        label="Seleccione los servicios a los que se remite" 
                        options={REMISIONES_SISTEMA} 
                        name={`integrantes.${i}.remisiones`} 
                        register={register} 
                      />
                    </div>
                  </>
                ) : null}

              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
