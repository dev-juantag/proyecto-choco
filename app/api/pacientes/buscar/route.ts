import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/verify-token'

export async function GET(request: Request) {
  try {
    const authResult = await verifyToken(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const { searchParams } = new URL(request.url)
    const doc = searchParams.get('doc')

    if (!doc || doc.trim() === '') {
      return NextResponse.json({ error: 'Documento no proporcionado' }, { status: 400 })
    }

    // Buscar al paciente. Incluimos la FichaHogar para extraer la dirección si la tiene allí.
    const paciente = await prisma.paciente.findUnique({
      where: { documento: doc },
      include: {
        ficha: {
          select: {
            direccion: true
          }
        }
      }
    })

    if (!paciente) {
      return NextResponse.json({ found: false }, { status: 404 })
    }

    return NextResponse.json({
      found: true,
      paciente: {
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        genero: paciente.sexo,
        fechaNacimiento: paciente.fechaNacimiento,
        telefono: paciente.telefono || '',
        direccion: paciente.direccion || paciente.ficha?.direccion || '',
        regimen: paciente.regimen || '',
        eapb: paciente.eapb || '',
      }
    })
  } catch (error) {
    console.error('Error buscando paciente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
