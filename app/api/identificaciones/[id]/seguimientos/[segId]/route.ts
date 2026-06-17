import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/verify-token";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; segId: string }> }
) {
  try {
    const auth = await verifyToken(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    if (auth.decoded?.rol !== 'SUPERADMIN') {
      return NextResponse.json({ error: "No tienes permiso para eliminar seguimientos. Solo un Superadmin puede realizar esta acción." }, { status: 403 });
    }

    const { id, segId } = await params;
    
    if (!id || !segId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const seguimiento = await prisma.seguimientoFamiliar.findUnique({
      where: { id: segId, fichaId: id }
    });

    if (!seguimiento) {
      return NextResponse.json({ error: "Seguimiento no encontrado" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Restaurar compromisos verificados en este seguimiento a su estado anterior (PENDIENTE)
      await tx.compromiso.updateMany({
        where: { verificadoEnId: segId },
        data: {
          estado: 'PENDIENTE',
          verificadoEnId: null,
          observacion: null
        }
      });

      // 2. Eliminar los compromisos que fueron CREADOS en este seguimiento
      await tx.compromiso.deleteMany({
        where: { creadoEnId: segId }
      });

      // 3. Eliminar el seguimiento
      await tx.seguimientoFamiliar.delete({
        where: { id: segId }
      });
    });

    return NextResponse.json({ success: true, message: "Seguimiento eliminado con éxito" });

  } catch (error: any) {
    console.error("DELETE SEGUIMIENTO ERROR:", error);
    return NextResponse.json({ error: "Error interno del servidor", detail: error?.message }, { status: 500 });
  }
}
