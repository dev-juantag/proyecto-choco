import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido");
  }

  try {
    const { email, password } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email },
      include: { territoriosAsignados: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      )
    }

    // --- LOGICA DE INACTIVIDAD (1 MES) ---
    // El usuario se considera activo si la bandera es explícitamente true o si no existe (null/undefined en BDs antiguas; Prisma por defecto usa true).
    let isActivo = (user as any).activo !== false;

    if (user.rol === "PROFESIONAL" && isActivo) {
      // Tomamos la fecha a comparar: lastLogin, si no existe usamos createdAt.
      const fechaBase = (user as any).lastLogin ? new Date((user as any).lastLogin) : new Date(user.createdAt);
      
      const limiteInactividad = new Date();
      limiteInactividad.setMonth(limiteInactividad.getMonth() - 1);

      if (fechaBase < limiteInactividad) {
        isActivo = false;
        // Lo desactivamos definitivamente en base de datos.
        await prisma.user.update({
          where: { id: user.id },
          data: { activo: false } as any // Asignación de tipo forzada temporalmente
        });
      }
    }

    if (!isActivo) {
      return NextResponse.json(
        { error: "Usuario desactivado por inactividad. Contacte al administrador para volver a activarlo." },
        { status: 403 }
      )
    }
    // ---------------------------------------

    // --- LÓGICA DE FUERZA BRUTA ---
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutosFaltantes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intente de nuevo en ${minutosFaltantes} minutos.` },
        { status: 429 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      const intentos = (user.failedLoginAttempts || 0) + 1
      let lockedUntil = user.lockedUntil
      
      if (intentos >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: intentos >= 5 ? 0 : intentos,
          lockedUntil: lockedUntil
        }
      })

      return NextResponse.json(
        { error: intentos >= 5 
            ? "Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos." 
            : `Contraseña incorrecta. Intento ${intentos} de 5.` 
        },
        { status: 401 }
      )
    }

    // Si entra con éxito, reiniciamos el contador
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null }
      })
    }
    // ---------------------------------------

    const token = jwt.sign(
      { 
        userId: user.id, 
        rol: user.rol,
        nombre: user.nombre,
        apellidos: user.apellidos,
        documento: user.documento,
        email: user.email,
        programaId: user.programaId,
        territorioId: user.territorioId,
        territorioIds: (user as any).territoriosAsignados?.map((t: any) => t.id) || []
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    // Acabar login exitoso: Actualizar 'lastLogin'
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() } as any
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        rol: user.rol.toLowerCase(),
        programaId: user.programaId,
        territorioId: user.territorioId,
        territorioIds: (user as any).territoriosAsignados?.map((t: any) => t.id) || [],
        documento: user.documento
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Error en el login, por favor recarga la página e intenta nuevamente" },
      { status: 500 }
    )
  }
}