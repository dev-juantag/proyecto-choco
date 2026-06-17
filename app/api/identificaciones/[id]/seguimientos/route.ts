export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fichaId } = await params;
    if (!fichaId) {
      return NextResponse.json({ error: "Falta el ID de la ficha" }, { status: 400 });
    }

    const body = await req.json();
    const { observacion, acuerdosCumplidos, responsableId, compromisosActualizados = [], nuevosCompromisos = [] } = body;

    if (!observacion || !responsableId) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const seguimiento = await prisma.$transaction(async (tx) => {
      // Calcular el consecutivo para esta ficha dentro de la transacción para asegurar atomicidad
      const count = await tx.seguimientoFamiliar.count({
        where: { fichaId }
      });
      const consecutivo = count + 1;

      // 1. Crear el SeguimientoFamiliar
      const seg = await tx.seguimientoFamiliar.create({
        data: {
          fichaId,
          observacion,
          acuerdosCumplidos: !!acuerdosCumplidos,
          responsableId,
          consecutivo
        }
      });

      // 2. Actualizar compromisos existentes
      if (compromisosActualizados.length > 0) {
        for (const c of compromisosActualizados) {
          await tx.compromiso.update({
            where: { id: c.id },
            data: {
              estado: c.estado,
              observacion: c.observacion || null,
              verificadoEnId: seg.id
            }
          });
        }
      }

      // 3. Crear nuevos compromisos
      if (nuevosCompromisos.length > 0) {
        for (const nc of nuevosCompromisos) {
          await tx.compromiso.create({
            data: {
              fichaId,
              pacienteId: nc.pacienteId || null,
              descripcion: nc.descripcion,
              fechaMeta: nc.fechaMeta ? new Date(nc.fechaMeta) : null,
              estado: 'PENDIENTE',
              creadoEnId: seg.id
            }
          });
        }
      }

      return seg;
    });

    return NextResponse.json({ success: true, seguimiento });
  } catch (error: any) {
    console.error("POST SEGUIMIENTO ERROR:", error);
    return NextResponse.json({ error: "Error interno del servidor", detail: error?.message }, { status: 500 });
  }
}
