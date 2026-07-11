'use client'

import { useFormContext } from 'react-hook-form'
import { TIPO_FAMILIA, APGAR_PREGUNTAS, APGAR_OPCIONES, ZARIT_OPCIONES, ZARIT_PREGUNTAS, ECOMAPA_OPCIONES, ECOMAPA_PREGUNTAS, VULNERABILIDADES } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { inp, sel, card, cardBorder, lbl, lblStyle, required as reqStyle, chk, chkLabel } from './wizardStyles'

export default function Step3Familia() {
  const { register, watch, setValue, getValues } = useFormContext()
  const cuidador = watch('cuidadorPrincipal')
  
  const vulnerabilidadesVal = watch('vulnerabilidades') || []

  const handleVulnerabilidadChange = (id: number, checked: boolean) => {
    let updated: number[] = [...vulnerabilidadesVal].map(Number)
    if (id === 10) { // Ninguna
      if (checked) {
        updated = [10] // Solo ninguna
      } else {
        updated = []
      }
    } else {
      if (checked) {
        updated = updated.filter(x => x !== 10)
        updated.push(id)
      } else {
        updated = updated.filter(x => x !== id)
      }
    }
    setValue('vulnerabilidades', updated, { shouldValidate: true })
  }

  // APGAR
  const [apgarScores, setApgarScores] = useState<number[]>(() => {
    const savedRespuestas = getValues('apgarRespuestas');
    if (Array.isArray(savedRespuestas) && savedRespuestas.length === 5) {
      return savedRespuestas.map(v => Number(v));
    }
    const saved = getValues('apgar');
    if (saved === '1') return [4, 4, 3, 3, 3];
    if (saved === '2') return [3, 3, 3, 2, 2];
    if (saved === '3') return [2, 2, 2, 2, 2];
    if (saved === '4') return [1, 1, 1, 1, 1];
    return [0, 0, 0, 0, 0];
  })

  const totalApgar = apgarScores.reduce((a, b) => a + b, 0)
  const apgarCat = totalApgar >= 17 ? 1 : totalApgar >= 13 ? 2 : totalApgar >= 10 ? 3 : 4
  const apgarLabel = APGAR_OPCIONES.find(o => o.id === apgarCat)?.label || ''
  const APGAR_VALORES = ['Nunca (0)', 'Casi nunca (1)', 'A veces (2)', 'Casi siempre (3)', 'Siempre (4)']

  const handleApgar = (index: number, value: number) => {
    const updated = [...apgarScores]
    updated[index] = value
    setApgarScores(updated)
  }

  useEffect(() => {
    setValue('apgarRespuestas', apgarScores, { shouldValidate: true })
    setValue('apgar', String(apgarCat), { shouldValidate: true })
  }, [apgarCat, apgarScores, setValue])

  // ECOMAPA
  const [ecomapaScores, setEcomapaScores] = useState<number[]>(() => {
    const savedRespuestas = getValues('ecomapaRespuestas');
    if (Array.isArray(savedRespuestas) && savedRespuestas.length === 5) {
      return savedRespuestas.map(v => Number(v));
    }
    return [0, 0, 0, 0, 0];
  })

  const totalEcomapa = ecomapaScores.reduce((a, b) => a + b, 0)
  const ecomapaCat = totalEcomapa >= 8 ? 1 : totalEcomapa >= 5 ? 2 : 3
  const ecomapaLabel = ECOMAPA_OPCIONES.find(o => o.id === ecomapaCat)?.label || ''
  const ECOMAPA_VALORES = ['No (0)', 'Parcialmente (1)', 'Sí (2)']

  const handleEcomapa = (index: number, value: number) => {
    const updated = [...ecomapaScores]
    updated[index] = value
    setEcomapaScores(updated)
  }

  useEffect(() => {
    setValue('ecomapaRespuestas', ecomapaScores, { shouldValidate: true })
    setValue('ecomapa', String(ecomapaCat), { shouldValidate: true })
  }, [ecomapaCat, ecomapaScores, setValue])

  // ZARIT
  const [zaritScores, setZaritScores] = useState<number[]>(() => {
    const savedRespuestas = getValues('zaritRespuestas');
    if (Array.isArray(savedRespuestas) && savedRespuestas.length === 5) {
      return savedRespuestas.map(v => Number(v));
    }
    return [0, 0, 0, 0, 0];
  })

  const totalZarit = zaritScores.reduce((a, b) => a + b, 0)
  const zaritCat = totalZarit >= 10 ? 3 : totalZarit >= 5 ? 2 : 1
  const zaritLabel = ZARIT_OPCIONES.find(o => o.id === zaritCat)?.label || ''
  const ZARIT_VALORES = ['Nunca (0)', 'Rara vez (1)', 'Algunas veces (2)', 'Bastantes veces (3)', 'Casi siempre (4)']

  const handleZarit = (index: number, value: number) => {
    const updated = [...zaritScores]
    updated[index] = value
    setZaritScores(updated)
  }

  useEffect(() => {
    if (cuidador) {
      setValue('zaritRespuestas', zaritScores, { shouldValidate: true })
      setValue('zarit', String(zaritCat), { shouldValidate: true })
    } else {
      setValue('zaritRespuestas', [], { shouldValidate: true })
      setValue('zarit', null, { shouldValidate: true })
    }
  }, [cuidador, zaritCat, zaritScores, setValue])

  return (
    <div className="space-y-4">

      {/* Estructura familiar */}
      <div className={card} style={cardBorder}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#081e69' }}>Estructura Familiar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="Tipo de familia" required>
            <select {...register('tipoFamilia')} className={sel}>
              <option value="">— Selecciona —</option>
              {TIPO_FAMILIA.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </F>
          <F label="N° de integrantes" required>
            <input type="number" min="1" placeholder="0" {...register('numIntegrantes')} className={inp} />
          </F>
        </div>
      </div>

      {/* APGAR */}
      <div className={card} style={cardBorder}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#081e69' }}>APGAR Familiar</p>
        <p className="text-[11px] text-gray-400 -mt-2">Califique cada pregunta del 0 al 4. Máx: 20 pts.</p>
        <div className="space-y-3">
          {APGAR_PREGUNTAS.map((pregunta, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-xs text-gray-700 font-medium">{i + 1}. {pregunta}</p>
              <div className="flex flex-wrap gap-1.5">
                {APGAR_VALORES.map((label, v) => (
                  <label
                    key={v}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg cursor-pointer border transition-all font-medium"
                    style={apgarScores[i] === v
                      ? { background: '#081e69', color: '#fff', borderColor: '#081e69' }
                      : { borderColor: '#e2e8f0', color: '#64748b', background: '#fff' }}
                  >
                    <input type="radio" name={`apgar_q${i}`} value={v} checked={apgarScores[i] === v}
                      onChange={() => handleApgar(i, v)} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', color: '#081e69' }}>
          Puntaje: {totalApgar}/20 → {apgarLabel}
        </div>
      </div>

      {/* Ecomapa */}
      <div className={card} style={cardBorder}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#081e69' }}>Valoración rápida del Ecomapa</p>
        <p className="text-[11px] text-gray-400 -mt-2">Califique cada pregunta del 0 al 2 (0 = No | 1 = Parcialmente | 2 = Sí). Máx: 10 pts.</p>
        <div className="space-y-3">
          {ECOMAPA_PREGUNTAS.map((pregunta, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-xs text-gray-700 font-medium">{i + 1}. {pregunta}</p>
              <div className="flex flex-wrap gap-1.5">
                {ECOMAPA_VALORES.map((label, v) => (
                  <label
                    key={v}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg cursor-pointer border transition-all font-medium"
                    style={ecomapaScores[i] === v
                      ? { background: '#081e69', color: '#fff', borderColor: '#081e69' }
                      : { borderColor: '#e2e8f0', color: '#64748b', background: '#fff' }}
                  >
                    <input type="radio" name={`ecomapa_q${i}`} value={v} checked={ecomapaScores[i] === v}
                      onChange={() => handleEcomapa(i, v)} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', color: '#081e69' }}>
          Puntaje: {totalEcomapa}/10 → {ecomapaLabel}
        </div>
      </div>

      {/* Riesgo Psicosocial / Zarit */}
      <div className={card} style={cardBorder}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#081e69' }}>Riesgo Psicosocial (Escala Zarit)</p>
        <F label="¿Existe cuidador principal?">
          <label className={chkLabel}>
            <input type="checkbox" {...register('cuidadorPrincipal')} className={chk} />
            <span className="text-xs font-medium">Sí hay cuidador principal</span>
          </label>
        </F>
        
        {cuidador && (
          <div className="space-y-3 mt-4 border-t pt-4">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#081e69' }}>Zarit (versión breve)</p>
            <p className="text-[11px] text-gray-400 -mt-2">Califique cada pregunta del 0 al 4. Máx: 20 pts.</p>
            <div className="space-y-3">
              {ZARIT_PREGUNTAS.map((pregunta, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-xs text-gray-700 font-medium">{i + 1}. {pregunta}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ZARIT_VALORES.map((label, v) => (
                      <label
                        key={v}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg cursor-pointer border transition-all font-medium"
                        style={zaritScores[i] === v
                          ? { background: '#081e69', color: '#fff', borderColor: '#081e69' }
                          : { borderColor: '#e2e8f0', color: '#64748b', background: '#fff' }}
                      >
                        <input type="radio" name={`zarit_q${i}`} value={v} checked={zaritScores[i] === v}
                          onChange={() => handleZarit(i, v)} className="sr-only" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', color: '#081e69' }}>
              Puntaje: {totalZarit}/20 → {zaritLabel}
            </div>
          </div>
        )}
      </div>

      {/* Vulnerabilidad Social */}
      <div className={card} style={cardBorder}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#081e69' }}>Vulnerabilidades Sociales</p>
        <F label="Selección múltiple (elige al menos una, o 'Ninguna')" required>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
            {VULNERABILIDADES.map(v => {
              const isChecked = vulnerabilidadesVal.map(Number).includes(v.id)
              return (
                <label key={v.id} className={chkLabel}>
                  <input 
                    type="checkbox" 
                    value={v.id} 
                    checked={isChecked}
                    onChange={(e) => handleVulnerabilidadChange(v.id, e.target.checked)} 
                    className={chk} 
                  />
                  <span className="text-xs">{v.label}</span>
                </label>
              )
            })}
          </div>
        </F>
      </div>

    </div>
  )
}

function F({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={`space-y-1 ${className || ''}`}>
      <label className={lbl} style={lblStyle}>
        {label} {required && <span style={reqStyle}>*</span>}
      </label>
      {children}
    </div>
  )
}
