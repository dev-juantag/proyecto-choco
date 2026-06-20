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
function LocationMarker({ position, setPosition, setFieldValue }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      setFieldValue('latitud', e.latlng.lat.toString())
      setFieldValue('longitud', e.latlng.lng.toString())
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

function MapUpdater({ position }: { position: L.LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, 18, { animate: true, duration: 1.5 })
    }
  }, [position, map])
  return null
}

export default function MapLocationPickerClient({ 
  lat, lng, setFieldValue, searchQuery
}: {
  lat: string | undefined, lng: string | undefined, setFieldValue: any, searchQuery: string
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  const previousQuery = useRef(searchQuery)
  const mapRef = useRef<any>(null)
  
  // Sincronizar estado local con valores del formulario
  useEffect(() => {
    if (lat && lng && !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng))) {
      setPosition(L.latLng(parseFloat(lat), parseFloat(lng)))
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
        center={position || [5.4828, -76.7397]} // Centro de Paimadó por defecto
        zoom={position ? 16 : 13} 
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} setFieldValue={setFieldValue} />
        {position && <MapUpdater position={position} />}
      </MapContainer>
    </div>
  )
}
