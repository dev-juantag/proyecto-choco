'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { inp, lbl, lblStyle, required as reqStyle, chk, chkLabel } from './wizardStyles'

export function F({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={`space-y-1 ${className || ''}`}>
      <label className={lbl} style={lblStyle}>
        {label} {required && <span style={reqStyle}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function Multi({ label, options, name, register, required, singleSelection }: { label: string; options: {id: number | string; label: string}[]; name: string; register: any, required?: boolean, singleSelection?: boolean }) {
  const { watch, setValue } = useFormContext()
  const rawValues = watch(name)
  const values = Array.isArray(rawValues) ? rawValues : (rawValues ? [rawValues] : [])
  const otherName = `${name}Otro`

  const isNone = (id: any) => {
    const option = options.find(o => String(o.id) === String(id))
    if (!option) return false
    const lbl = option.label.toLowerCase()
    return lbl === 'ninguno' || lbl === 'ninguna' || lbl.startsWith('ningun')
  }

  const isOther = (id: any) => {
    const option = options.find(o => String(o.id) === String(id))
    if (!option) return false
    const lbl = option.label.toLowerCase()
    return lbl === 'otro' || lbl === 'otros'
  }

  const handleChange = (id: any, checked: boolean) => {
    if (singleSelection) {
      if (checked) setValue(name, [id])
      else setValue(name, [])
      return
    }

    let newValues = Array.isArray(values) ? [...values] : []
    const cleanId = typeof id === 'number' ? id : String(id)
    
    if (checked) {
      if (isNone(id)) {
        // Si marca ninguno, limpia todo lo demás
        newValues = [id]
      } else {
        // Si marca cualquier otro, quita los 'ninguno'
        newValues = newValues.filter(v => !isNone(v))
        newValues.push(id)
      }
    } else {
      newValues = newValues.filter(v => String(v) !== String(id) && Number(v) !== Number(id))
    }
    
    setValue(name, newValues)
  }

  const showOtherInput = Array.isArray(values) && values.some((v: any) => isOther(v))

  return (
    <F label={label} required={required}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
        {options.map(o => {
          const isChecked = values.some(v => String(v) === String(o.id))
          return (
            <label key={o.id} className={chkLabel}>
              <input 
                type="checkbox" 
                checked={isChecked}
                onChange={(e) => handleChange(o.id, e.target.checked)}
                className={chk} 
              />
              <span className="text-xs leading-tight">{o.label}</span>
            </label>
          )
        })}
      </div>
      {showOtherInput && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <input 
            {...register(otherName)} 
            placeholder={`Especifique ${label.toLowerCase()}...`} 
            className={`${inp} text-xs py-1.5 h-8 border-emerald-200 bg-emerald-50/30`} 
          />
        </div>
      )}
    </F>
  )
}
