import { z } from "zod";

export const integranteSchema = z.object({
  id: z.string().optional(),
  nombres: z.string().optional().nullable(),
  apellidos: z.string().optional().nullable(),
  datosDesconocidos: z.boolean().default(false),
  tipoDoc: z.string().optional().nullable(),
  numDoc: z.string().optional().nullable(),
  fechaNacimiento: z.string().optional().nullable(),
  parentesco: z.union([z.string(), z.number()]).transform(v => String(v)),
  sexo: z.string().optional().nullable(),
  gestante: z.string().default("NA"),
  mesesGestacion: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  telefono: z.string().optional().nullable(),
  nivelEducativo: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  ocupacion: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  regimen: z.string().optional().nullable(),
  eapb: z.string().optional().nullable(),
  etnia: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  puebloIndigena: z.string().optional().nullable(),
  grupoPoblacional: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  discapacidades: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  padreId: z.string().optional().nullable(),
  madreId: z.string().optional().nullable(),
  parejaId: z.string().optional().nullable(),
  tipoPareja: z.string().default("UNION_LIBRE"),
  tipoHijo: z.string().default("BIOLOGICO"),
  estadoVital: z.string().default("VIVO"),
  
  // Health parameters
  antecedentes: z.any().default({}),
  antecTransmisibles: z.any().default({}),
  peso: z.string().optional().nullable(),
  talla: z.string().optional().nullable(),
  perimetroBraquial: z.string().optional().nullable(),
  diagNutricional: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  practicaDeportiva: z.boolean().default(false),
  lactanciaMaterna: z.boolean().default(false),
  lactanciaMeses: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  esquemaAtenciones: z.boolean().default(false),
  esquemaVacunacion: z.boolean().default(false),
  intervencionesPendientes: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  enfermedadAguda: z.boolean().default(false),
  recibeAtencionMedica: z.boolean().default(false),
  remisiones: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  if (!data.datosDesconocidos) {
    if (!data.nombres || data.nombres.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nombres'], message: 'Los nombres son obligatorios' });
    }
    if (!data.apellidos || data.apellidos.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['apellidos'], message: 'Los apellidos son obligatorios' });
    }
    if (!data.tipoDoc || data.tipoDoc.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tipoDoc'], message: 'El tipo de documento es obligatorio' });
    }
    if (!data.numDoc || data.numDoc.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['numDoc'], message: 'El número de documento es obligatorio' });
    }
    if (!data.fechaNacimiento || data.fechaNacimiento.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fechaNacimiento'], message: 'La fecha de nacimiento es obligatoria' });
    }
    if (!data.sexo || data.sexo.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sexo'], message: 'El sexo es obligatorio' });
    }
  } else {
    // Si datosDesconocidos es true, solo validamos nombres y apellidos (según la respuesta del usuario)
    if (!data.nombres || data.nombres.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nombres'], message: 'Los nombres son obligatorios, incluso si no conoce los demás datos' });
    }
    if (!data.apellidos || data.apellidos.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['apellidos'], message: 'Los apellidos son obligatorios, incluso si no conoce los demás datos' });
    }
  }
});

export const wizardSchema = z.object({
  estadoVisita: z.string().min(1, "El estado de la visita es obligatorio"),
  fechaDiligenciamiento: z.string().min(1, "La fecha de diligenciamiento es obligatoria"),
  uzpe: z.string().optional().nullable(),
  departamento: z.string().min(1, "El departamento es obligatorio"),
  municipio: z.string().min(1, "El municipio es obligatorio"),
  centroPoblado: z.string().optional().nullable(),
  direccion: z.string().min(1, "La dirección es obligatoria"),
  latitud: z.union([z.number(), z.string()]).optional().nullable(),
  longitud: z.union([z.number(), z.string()]).optional().nullable(),
  numEBS: z.string().optional().nullable(),
  prestadorPrimario: z.string().optional().nullable(),
  perfilEncuestador: z.string().min(1, "El perfil del encuestador es obligatorio"),
  tipoDocEncuestador: z.string().optional().nullable(),
  numDocEncuestador: z.string().optional().nullable(),
  microterritorio: z.string().min(1, "El microterritorio es obligatorio"),
  observacionesRechazo: z.string().optional().nullable(),
  
  // Vivienda
  numHogar: z.string().optional().nullable(),
  numFamilia: z.string().optional().nullable(),
  codFicha: z.string().optional().nullable(),
  tipoVivienda: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  tipoViviendaDesc: z.string().optional().nullable(),
  matParedes: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  matPisos: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  matTechos: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  numHogares: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  numDormitorios: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  estratoSocial: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  hacinamiento: z.boolean().default(false),
  fuenteAgua: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  dispExcretas: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  aguasResiduales: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  dispResiduos: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  riesgoAccidente: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  fuenteEnergia: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  presenciaVectores: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').default(false),
  animales: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  cantAnimales: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  vacunacionMascotas: z.boolean().default(false),
  
  // Familia
  tipoFamilia: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  numIntegrantes: z.string().default("1"),
  apgar: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  apgarRespuestas: z.array(z.union([z.number(), z.string()]).transform(v => Number(v))).default([]),
  ecomapa: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  cuidadorPrincipal: z.boolean().default(false),
  zarit: z.union([z.string(), z.number()]).optional().nullable().transform(v => v ? String(v) : null),
  vulnerabilidades: z.array(z.union([z.string(), z.number()]).transform(v => Number(v))).default([]),
  
  integrantes: z.array(integranteSchema).default([]),
}).superRefine((data, ctx) => {
  if (data.estadoVisita === "1") {
    // Si presencia de vectores es true, exigimos animales y cantAnimales
    if (data.presenciaVectores === true) {
      if (!data.animales || data.animales.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['animales'],
          message: 'Debe seleccionar al menos un animal si indicó que hay vectores/zoonosis',
        });
      }
      if (!data.cantAnimales || String(data.cantAnimales).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cantAnimales'],
          message: 'Debe especificar la cantidad de animales en la vivienda',
        });
      }
    }
  }
});

export type IntegranteData = z.infer<typeof integranteSchema>;
export type WizardData = z.infer<typeof wizardSchema>;
export type View = "inicio" | "atenciones" | "usuarios" | "territorios" | "reportes" | "programas" | "pacientes" | "identificaciones" | "mi-territorio" | "consolidado-territorios";
export interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}
