'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { EsriProvider } from 'leaflet-geosearch'

// Arreglo para que los iconos por defecto de Leaflet funcionen en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Evento para clics en el mapa
function LocationMarker({ position, setPosition, setFieldValue, setZoomLevel }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      setFieldValue('latitud', e.latlng.lat.toString())
      setFieldValue('longitud', e.latlng.lng.toString())
      setZoomLevel(18)
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

function MapUpdater({ position, zoom }: { position: L.LatLng | null; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { animate: true, duration: 1.5 })
    }
  }, [position, zoom, map])
  return null
}

export default function MapLocationPickerClient({ 
  lat, lng, setFieldValue, searchQuery
}: {
  lat: string | undefined, lng: string | undefined, setFieldValue: any, searchQuery: string
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  const [zoomLevel, setZoomLevel] = useState(6)
  const previousQuery = useRef(searchQuery)
  const mapRef = useRef<any>(null)
  const positionRef = useRef<L.LatLng | null>(null)
  positionRef.current = position
  
  // Sincronizar estado local con valores del formulario
  useEffect(() => {
    if (lat && lng && !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng))) {
      const parsedLat = parseFloat(lat)
      const parsedLng = parseFloat(lng)
      const currentPos = positionRef.current
      
      // Solo sincronizar si es un cambio externo real (Carga inicial o GPS manual)
      const isDifferent = !currentPos || 
        Math.abs(currentPos.lat - parsedLat) > 0.0001 || 
        Math.abs(currentPos.lng - parsedLng) > 0.0001;

      if (isDifferent) {
        setPosition(L.latLng(parsedLat, parsedLng))
        setZoomLevel(18)
      }
    }
  }, [lat, lng])

  // Geocodificación Automática (Debounced)
  useEffect(() => {
    if (searchQuery && searchQuery.length > 5 && searchQuery !== previousQuery.current) {
      previousQuery.current = searchQuery
      
      const timeoutId = setTimeout(async () => {
        try {
          const provider = new EsriProvider()
          
          let results: any[] = []
          const parts = searchQuery.split(',').map(s => s.trim()).filter(Boolean)
          
          for (let i = 0; i < parts.length; i++) {
            const queryStr = parts.slice(i).join(', ') + ', Colombia'
            results = await provider.search({ query: queryStr })
            if (results && results.length > 0) {
              break;
            }
          }
          
          if (results && results.length > 0) {
            const best = results[0]
            const newPos = L.latLng(best.y, best.x)
            
            // Zoom en 4 fases basado en la profundidad de los campos diligenciados:
            const rawParts = searchQuery.split(',').map(s => s.trim())
            const hasDireccion = !!rawParts[0]
            const hasCentroPoblado = !!rawParts[1]
            const hasMunicipio = !!rawParts[2]
            const hasDepartamento = !!rawParts[3]

            let targetZoom = 6
            if (hasDireccion) {
              targetZoom = 18 // Fase 3: Dirección completa (Máxima aproximación)
            } else if (hasCentroPoblado) {
              targetZoom = 14 // Fase 2: Barrio/Centro Poblado (Aproximación del sector)
            } else if (hasMunicipio || hasDepartamento) {
              targetZoom = 11 // Fase 1: Departamento/Municipio (Vista amplia del municipio)
            }

            setZoomLevel(targetZoom)
            setPosition(newPos)
            setFieldValue('latitud', best.y.toString(), { shouldValidate: true })
            setFieldValue('longitud', best.x.toString(), { shouldValidate: true })
          }
        } catch (e) {
          console.error("Falló la búsqueda de geocodificación", e)
        }
      }, 1500) // Esperar 1.5 segundos a que termine de escribir
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, setFieldValue])

  return (
    <div className="w-full h-[350px] rounded-xl overflow-hidden border-2 border-slate-200 z-10 relative shadow-sm">
      <MapContainer 
        center={position || [4.5709, -74.2973]} // Vista amplia de Colombia por defecto
        zoom={position ? zoomLevel : 6} 
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} setFieldValue={setFieldValue} setZoomLevel={setZoomLevel} />
        {position && <MapUpdater position={position} zoom={zoomLevel} />}
      </MapContainer>
    </div>
  )
}
