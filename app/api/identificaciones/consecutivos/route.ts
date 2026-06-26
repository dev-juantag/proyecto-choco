import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const numEBS = searchParams.get('numEBS') || 'EBS00'

    // El prefijo puede ser EBS01 o T01 (dependiendo del formato de tu sistema), pero numEBS es EBS0X
    // Extraemos el código numérico para generar el formato T0X
    const numStr = numEBS.replace(/\D/g, '') // Quita letras, deja "05" o "08"
    const prefixT = `T${numStr}`

    // Buscar el último registro de este territorio validando que existan matrioshkas
    const lastFicha = await prisma.fichaHogar.findFirst({
      where: { 
        numEBS,
        numHogar: { not: null }
      },
      orderBy: { 
        fechaDiligenciamiento: 'desc' 
      }
    })

    let hogarIdx = 1
    let famIdx = 1
    let fichaIdx = 1

    if (lastFicha && lastFicha.numHogar) {
      const numHMatch = lastFicha.numHogar.match(/H(\d+)$/)
      const numFMatch = lastFicha.numFamilia?.match(/F(\d+)$/)
      const codFMatch = lastFicha.codFicha?.match(/CF(\d+)$/)

      hogarIdx = numHMatch ? parseInt(numHMatch[1]) + 1 : 1
      famIdx = numFMatch ? parseInt(numFMatch[1]) + 1 : 1
      fichaIdx = codFMatch ? parseInt(codFMatch[1]) + 1 : 1
    }

    let nextHogar = `${prefixT}H${String(hogarIdx).padStart(4, '0')}`
    let nextFamilia = `${nextHogar}F${String(famIdx).padStart(4, '0')}`
    let nextFicha = `${nextFamilia}CF${String(fichaIdx).padStart(3, '0')}`

    // Bucle para garantizar unicidad absoluta en base de datos
    let exists = true
    let safetyCounter = 0
    while (exists && safetyCounter < 1000) {
      safetyCounter++
      const conflict = await prisma.fichaHogar.findFirst({
        where: {
          OR: [
            { numHogar: nextHogar },
            { numFamilia: nextFamilia },
            { codFicha: nextFicha }
          ]
        }
      })
      if (!conflict) {
        exists = false
      } else {
        hogarIdx++
        famIdx++
        fichaIdx++
        nextHogar = `${prefixT}H${String(hogarIdx).padStart(4, '0')}`
        nextFamilia = `${nextHogar}F${String(famIdx).padStart(4, '0')}`
        nextFicha = `${nextFamilia}CF${String(fichaIdx).padStart(3, '0')}`
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        numHogar: nextHogar,
        numFamilia: nextFamilia,
        codFicha: nextFicha
      }
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
