'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  ANTECEDENTES_CRONICOS, ANTECEDENTES_TRANSMISIBLES, INTERVENCIONES_PENDIENTES,
  REMISIONES_SISTEMA, DIAGNOSTICO_NUTRICIONAL, calcularEdad
} from '@/lib/constants'
import { inp, sel, lbl, lblStyle, chk, chkLabel } from './wizardStyles'
import { F, Multi } from './wizardComponents'

export default function Step5Salud() {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext()
  const { fields } = useFieldArray({ control, name: 'integrantes' })
  const [expanded, setExpanded] = useState<number[]>(Array.from({length: Math.max(1, fields.length)}, (_, i) => i))

  const toggle = (i: number) => setExpanded(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  )

  const calculateMetalRisk = (i: number) => {
    const occ = watch(`integrantes.${i}.riesgoMetalesPesados.ocupacion`) || [];
    const occYears = watch(`integrantes.${i}.riesgoMetalesPesados.ocupacionTiempo`);
    const env = watch(`integrantes.${i}.riesgoMetalesPesados.ambiental`) || [];
    const fish = watch(`integrantes.${i}.riesgoMetalesPesados.pescado`);
    const sxNeu = watch(`integrantes.${i}.riesgoMetalesPesados.sintomasNeu`) || [];
    const sxRen = watch(`integrantes.${i}.riesgoMetalesPesados.sintomasRen`) || [];
    const sxDig = watch(`integrantes.${i}.riesgoMetalesPesados.sintomasDig`) || [];
    const sxOtr = watch(`integrantes.${i}.riesgoMetalesPesados.sintomasOtr`) || [];

    const hasOcc = occ.length > 0 && !occ.includes('NINGUNA');
    const hasEnv = env.length > 0 && !env.includes('NINGUNO');
    
    const isHighOcc = hasOcc && (occYears === '6-10' || occYears === 'mas-10' || occ.includes('MINERIA_ARTESANAL') || occ.includes('MINERIA_INDUSTRIAL'));
    const isHighEnv = env.includes('ZONA_MINERA') || env.includes('RIO_MINERIA');
    const isHighFish = fish === '3_MAS';
    const hasHighSx = sxNeu.length > 0 || sxRen.length > 0;

    if (isHighOcc || isHighEnv || isHighFish || hasHighSx) {
      return { label: 'Riesgo Alto', color: '#ef4444', value: 'ALTO' };
    }

    const hasAnySx = sxDig.length > 0 || sxOtr.length > 0 || hasOcc || hasEnv || fish === '1_2_SEMANA';
    if (hasAnySx) {
      return { label: 'Riesgo Medio', color: '#f59e0b', value: 'MEDIO' };
    }

    return { label: 'Riesgo Bajo', color: '#10b981', value: 'BAJO' };
  };

  return (
    <div className="space-y-3">
      <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', color: '#081e69' }}>
        Complete la sección de salud para cada integrante del paso anterior.
      </p>

      {fields.map((field, i) => {
        const fnac = watch(`integrantes.${i}.fechaNacimiento`)
        const edad = fnac ? calcularEdad(fnac) : null
        const nombre = `${watch(`integrantes.${i}.nombres`) || 'Integrante'} ${watch(`integrantes.${i}.apellidos`) || ''}`
        const open = expanded.includes(i)
        const enfermedadAguda = watch(`integrantes.${i}.enfermedadAguda`)
        const datosDesconocidos = watch(`integrantes.${i}.datosDesconocidos`)

        // Calcular IMC
        const pesoVal = parseFloat(watch(`integrantes.${i}.peso`))
        const tallaVal = parseFloat(watch(`integrantes.${i}.talla`))
        const imc = (pesoVal && tallaVal) ? (pesoVal / Math.pow(tallaVal / 100, 2)).toFixed(1) : null

        // Antecedente de Cáncer
        const antecedentes = watch(`integrantes.${i}.antecedentes`) || []
        const hasCancer = Array.isArray(antecedentes) ? antecedentes.includes('CA') : false

        // Calcular Riesgo de Metales Pesados en tiempo real
        const metalRisk = calculateMetalRisk(i)

        return (
          <div key={field.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e8f0' }}>
            {/* Header */}
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
                  {edad !== null && !datosDesconocidos && <p className="text-[10px] text-gray-400">{edad} años</p>}
                  {datosDesconocidos && <p className="text-[10px] text-orange-500 font-bold">Datos parciales (Salud desactivada)</p>}
                </div>
              </div>
              {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Body */}
            {open && (
              <div className="p-4 space-y-4 bg-white">
                {datosDesconocidos ? (
                  <p className="text-xs text-orange-600 font-semibold text-center py-3 bg-orange-50 rounded-lg border border-orange-200">
                    Este integrante no tiene información personal completa. Complete sus datos personales en el Paso 4 para habilitar la sección de salud.
                  </p>
                ) : (
                  <>
                    {/* Antecedentes Crónicos */}
                    <Multi 
                      label="Antecedentes Patológicos Crónicos" 
                      options={ANTECEDENTES_CRONICOS} 
                      name={`integrantes.${i}.antecedentes`} 
                      register={register} 
                    />

                    {hasCancer && (
                      <F label="¿Qué tipo de cáncer?" required>
                        <input 
                          type="text" 
                          {...register(`integrantes.${i}.tipoCancer`)} 
                          placeholder="Ej. Cáncer de mama, próstata..." 
                          className={inp} 
                        />
                      </F>
                    )}

                    {/* Transmisibles */}
                    <Multi 
                      label="Enfermedades Transmisibles" 
                      options={ANTECEDENTES_TRANSMISIBLES} 
                      name={`integrantes.${i}.antecTransmisibles`} 
                      register={register} 
                    />

                    {/* Antropometría y Signos Vitales */}
                    <FS title="Medidas Antropométricas y Signos Vitales">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-2">Datos Antropométricos</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <F label="Peso (kg)" required>
                              <input type="number" step="0.1" {...register(`integrantes.${i}.peso`)} className={inp} placeholder="65.5" />
                            </F>
                            <F label="Talla (cm)" required>
                              <input type="number" step="0.1" {...register(`integrantes.${i}.talla`)} className={inp} placeholder="170" />
                            </F>
                            <F label="IMC (Calculado)">
                              <input type="text" readOnly value={imc ? `${imc}` : 'Autocalculado'} className={`${inp} bg-gray-100 font-bold`} />
                            </F>
                            <F label="P. Braquial (cm)">
                              <input type="number" step="0.1" {...register(`integrantes.${i}.perimetroBraquial`)} className={inp} placeholder="25" />
                            </F>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-2">Signos Vitales</p>
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
                            {edad !== null && edad < 5 && (
                              <F label="Perímetro Cefálico (cm)">
                                <input type="number" step="0.1" {...register(`integrantes.${i}.perimetroCefalico`)} className={inp} placeholder="35" />
                              </F>
                            )}
                          </div>
                        </div>
                      </div>
                    </FS>

                    {/* Prevención */}
                    <FS title="Prevención y Hábitos">
                      <div className="space-y-2">
                        <label className={chkLabel}>
                          <input type="checkbox" {...register(`integrantes.${i}.practicaDeportiva`)} className={chk} />
                          <span className="text-xs">¿Realiza práctica deportiva?</span>
                        </label>
                        {edad !== null && edad < 2 && (
                          <>
                            <label className={chkLabel}>
                              <input type="checkbox" {...register(`integrantes.${i}.lactanciaMaterna`)} className={chk} />
                              <span className="text-xs">Lactancia materna exclusiva (&lt;2 años)</span>
                            </label>
                            {watch(`integrantes.${i}.lactanciaMaterna`) && (
                              <F label="Duración lactancia (meses)">
                                <input type="number" min="0" max="24" {...register(`integrantes.${i}.lactanciaMeses`)} className={inp} />
                              </F>
                            )}
                          </>
                        )}
                        <label className={chkLabel}>
                          <input type="checkbox" {...register(`integrantes.${i}.esquemaAtenciones`)} className={chk} />
                          <span className="text-xs">¿Cumple esquema de atenciones de P&M?</span>
                        </label>
                        <label className={chkLabel}>
                          <input type="checkbox" {...register(`integrantes.${i}.esquemaVacunacion`)} className={chk} />
                          <span className="text-xs">¿Cumple esquema de vacunación?</span>
                        </label>
                      </div>
                    </FS>

                    {/* Nuevo módulo: Riesgo por exposición a metales pesados */}
                    <FS title="Exposición a Metales Pesados">
                      <div className="space-y-4">
                        <Multi 
                          label="¿Trabaja o ha trabajado en alguna de las siguientes actividades?" 
                          options={[
                            { id: 'MINERIA_ARTESANAL', label: 'Minería artesanal' },
                            { id: 'MINERIA_INDUSTRIAL', label: 'Minería industrial' },
                            { id: 'SOLDADURA', label: 'Soldadura' },
                            { id: 'PINTURA', label: 'Fabricación o aplicación de pinturas' },
                            { id: 'QUIMICA', label: 'Industria química' },
                            { id: 'ESTACION_SERVICIO', label: 'Estaciones de servicio' },
                            { id: 'AGRICULTURA_PESTICIDAS', label: 'Agricultura con uso de pesticidas/herbicidas' },
                            { id: 'RECICLAJE_BATERIAS', label: 'Reciclaje de baterías o chatarra electrónica' },
                            { id: 'FUNDICION', label: 'Fundición o metalurgia' },
                            { id: 'NINGUNA', label: 'Ninguna de las anteriores' }
                          ]} 
                          name={`integrantes.${i}.riesgoMetalesPesados.ocupacion`} 
                          register={register} 
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <F label="Tiempo de exposición">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.ocupacionTiempo`)} className={sel}>
                              <option value="">— Selecciona —</option>
                              <option value="menos-1">Menos de 1 año</option>
                              <option value="1-5">1–5 años</option>
                              <option value="6-10">6–10 años</option>
                              <option value="mas-10">Más de 10 años</option>
                            </select>
                          </F>
                          <F label="¿Continúa expuesto actualmente?">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.continuaExpuesto`)} className={sel}>
                              <option value="">— Selecciona —</option>
                              <option value="SI">Sí</option>
                              <option value="NO">No</option>
                            </select>
                          </F>
                          <F label="¿Utiliza elementos de protección personal?">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.utilizaEPP`)} className={sel}>
                              <option value="">— Selecciona —</option>
                              <option value="SIEMPRE">Siempre</option>
                              <option value="ALGUNAS_VECES">Algunas veces</option>
                              <option value="NUNCA">Nunca</option>
                            </select>
                          </F>
                        </div>

                        <hr className="border-gray-100" />

                        <Multi 
                          label="¿Vive o ha vivido cerca de alguno de los siguientes lugares?" 
                          options={[
                            { id: 'ZONA_MINERA', label: 'Zona minera' },
                            { id: 'RIO_MINERIA', label: 'Río afectado por minería' },
                            { id: 'PLANTA_INDUSTRIAL', label: 'Planta industrial' },
                            { id: 'TALLER_FUNDICION', label: 'Taller de soldadura o fundición' },
                            { id: 'CULTIVOS_PESTICIDAS', label: 'Cultivos donde se aplican pesticidas' },
                            { id: 'NINGUNO', label: 'Ninguno' }
                          ]} 
                          name={`integrantes.${i}.riesgoMetalesPesados.ambiental`} 
                          register={register} 
                        />

                        <F label="Tiempo de residencia">
                          <select {...register(`integrantes.${i}.riesgoMetalesPesados.ambientalTiempo`)} className={sel}>
                            <option value="">— Selecciona —</option>
                            <option value="menos-1">Menos de 1 año</option>
                            <option value="1-5">1–5 años</option>
                            <option value="mas-5">Más de 5 años</option>
                          </select>
                        </F>

                        <hr className="border-gray-100" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <F label="¿Consume pescado o alimentos del río?">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.pescado`)} className={sel}>
                              <option value="">— Selecciona —</option>
                              <option value="NUNCA">Nunca</option>
                              <option value="OCASIONAL">Ocasionalmente</option>
                              <option value="1_2_SEMANA">1–2 veces por semana</option>
                              <option value="3_MAS">3 o más veces por semana</option>
                            </select>
                          </F>
                          <F label="Tipo de pescado consumido">
                            <input type="text" {...register(`integrantes.${i}.riesgoMetalesPesados.pescadoTipo`)} className={inp} placeholder="Ej. Bocachico, Bagre..." />
                          </F>
                          <F label="¿Tiene o ha tenido amalgamas dentales?">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.amalgamas`)} className={sel}>
                              <option value="">— Selecciona —</option>
                              <option value="SI">Sí</option>
                              <option value="NO">No</option>
                            </select>
                          </F>
                          <F label="Número aproximado de amalgamas">
                            <input type="number" min="0" {...register(`integrantes.${i}.riesgoMetalesPesados.amalgamasCant`)} className={inp} placeholder="0" />
                          </F>
                        </div>

                        <hr className="border-gray-100" />

                        <p className="text-xs font-bold text-gray-700">Síntomas Relacionados</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Multi 
                            label="Neurológicos" 
                            options={[
                              { id: 'DOLOR_CABEZA', label: 'Dolor de cabeza' },
                              { id: 'MAREOS', label: 'Mareos' },
                              { id: 'HORMIGUEO', label: 'Hormigueo' },
                              { id: 'TEMBLOR', label: 'Temblor' },
                              { id: 'PERDIDA_MEMORIA', label: 'Pérdida de memoria' },
                              { id: 'DIFICULTAD_CONCENTRACION', label: 'Dificultad para concentrarse' },
                              { id: 'ALTERACIONES_VISUALES', label: 'Alteraciones visuales' }
                            ]} 
                            name={`integrantes.${i}.riesgoMetalesPesados.sintomasNeu`} 
                            register={register} 
                          />
                          <Multi 
                            label="Digestivos" 
                            options={[
                              { id: 'DOLOR_ABDOMINAL', label: 'Dolor abdominal' },
                              { id: 'NAUSEAS', label: 'Náuseas' },
                              { id: 'VOMITO', label: 'Vómito' },
                              { id: 'DIARREA', label: 'Diarrea' },
                              { id: 'ESTRENIMIENTO', label: 'Estreñimiento' },
                              { id: 'PERDIDA_APETITO', label: 'Pérdida del apetito' }
                            ]} 
                            name={`integrantes.${i}.riesgoMetalesPesados.sintomasDig`} 
                            register={register} 
                          />
                          <Multi 
                            label="Renales y Urinarios" 
                            options={[
                              { id: 'DOLOR_ORINAR', label: 'Dolor al orinar' },
                              { id: 'DISMINUCION_ORINA', label: 'Disminución de la orina' },
                              { id: 'SANGRE_ORINA', label: 'Sangre en la orina' },
                              { id: 'INFLAMACION', label: 'Inflamación' },
                              { id: 'ENFERMEDAD_RENAL', label: 'Enfermedad renal' }
                            ]} 
                            name={`integrantes.${i}.riesgoMetalesPesados.sintomasRen`} 
                            register={register} 
                          />
                          <Multi 
                            label="Otros síntomas" 
                            options={[
                              { id: 'FATIGA', label: 'Fatiga' },
                              { id: 'DEBILIDAD_MUSCULAR', label: 'Debilidad muscular' },
                              { id: 'PERDIDA_PESO', label: 'Pérdida de peso' }
                            ]} 
                            name={`integrantes.${i}.riesgoMetalesPesados.sintomasOtr`} 
                            register={register} 
                          />
                        </div>

                        <hr className="border-gray-100" />

                        <p className="text-xs font-bold text-gray-700 font-mono">Antecedentes Médicos</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <F label="¿Intoxicación por metales diagnosticada?">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.antecedenteDiagnostico`)} className={sel}>
                              <option value="">— Selecciona —</option>
                              <option value="SI">Sí</option>
                              <option value="NO">No</option>
                            </select>
                          </F>
                          <F label="¿Le han realizado pruebas para metales?">
                            <select {...register(`integrantes.${i}.riesgoMetalesPesados.antecedentePruebas`)} className={sel}>
                              <option value="">— Selecciona —</option>
                              <option value="SI">Sí</option>
                              <option value="NO">No</option>
                            </select>
                          </F>
                          <F label="Resultado de la prueba" className="sm:col-span-2">
                            <textarea {...register(`integrantes.${i}.riesgoMetalesPesados.resultadoPruebas`)} className={`${inp} min-h-[50px]`} placeholder="Ej. Mercurio en sangre: 5 ug/L, Plomo: Normal..." />
                          </F>
                        </div>

                        <div className="p-3 rounded-lg flex items-center justify-between border" style={{ background: metalRisk.color + '15', borderColor: metalRisk.color + '40' }}>
                          <span className="text-xs font-black" style={{ color: metalRisk.color }}>CLASIFICACIÓN AUTOMÁTICA DEL RIESGO</span>
                          <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{ background: metalRisk.color }}>
                            {metalRisk.label}
                          </span>
                          <input type="hidden" {...register(`integrantes.${i}.riesgoMetalesPesados.clasificacionRiesgo`)} value={metalRisk.value} />
                        </div>
                      </div>
                    </FS>

                    {/* Intervenciones */}
                    <Multi 
                      label="Intervenciones Pendientes" 
                      options={INTERVENCIONES_PENDIENTES} 
                      name={`integrantes.${i}.intervencionesPendientes`} 
                      register={register} 
                    />

                    {/* Enfermedad Aguda */}
                    <FS title="Enfermedad Aguda">
                      <div className="space-y-2">
                        <label className={chkLabel}>
                          <input type="checkbox" {...register(`integrantes.${i}.enfermedadAguda`)} className={chk} />
                          <span className="text-xs">¿Presenta enfermedad respiratoria, diarreica, alergia o accidente el último mes?</span>
                        </label>
                        {enfermedadAguda && (
                          <label className={chkLabel + ' ml-5'}>
                            <input type="checkbox" {...register(`integrantes.${i}.recibeAtencionMedica`)} className={chk} />
                            <span className="text-xs">¿Recibe atención médica actualmente?</span>
                          </label>
                        )}
                      </div>
                    </FS>

                    {/* Remisiones */}
                    <Multi 
                      label="Remisiones Recomendadas" 
                      options={REMISIONES_SISTEMA} 
                      name={`integrantes.${i}.remisiones`} 
                      register={register} 
                    />

                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FS({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#081e6966', borderTop: '1px solid #e8ecf5', paddingTop: '10px' }}>
        {title}
      </p>
      {children}
    </div>
  )
}


