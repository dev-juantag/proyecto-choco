export const COMPANY_NAME = "Plataforma Gestion Poblacional";

export const ESTADO_VISITA = [
  { id: "1", label: "EFECTIVA" },
  { id: "2", label: "NO EFECTIVA" },
  { id: "3", label: "RECHAZADA / NEGADA" }
];

export const TIPO_VIVIENDA = [
  { id: 1, label: "Casa" },
  { id: 2, label: "Apartamento" },
  { id: 3, label: "Habitación o cuarto" },
  { id: 4, label: "Finca o vivienda rural" },
  { id: 5, label: "Vivienda indígena" },
  { id: 6, label: "Refugio / Albergue" },
  { id: 7, label: "Otro" }
];

export const MATERIAL_PAREDES = [
  { id: 1, label: "Bloque, ladrillo, piedra o concreto" },
  { id: 2, label: "Madera pulida" },
  { id: 3, label: "Madera burda, tabla o tablón" },
  { id: 4, label: "Tapia pisada o adobe" },
  { id: 5, label: "Bahareque" },
  { id: 6, label: "Lámina metálica (zinc)" },
  { id: 7, label: "Materiales provisionales (cartón, tela, plástico, desechos)" },
  { id: 8, label: "Sin paredes" },
  { id: 9, label: "Otro" }
];

export const MATERIAL_PISOS = [
  { id: 1, label: "Mármol, porcelanato, baldosa, cerámica o terrazo" },
  { id: 2, label: "Madera pulida o laminado" },
  { id: 3, label: "Alfombra" },
  { id: 4, label: "Cemento" },
  { id: 5, label: "Gravilla" },
  { id: 6, label: "Madera burda, tabla o tablón" },
  { id: 7, label: "Tierra o arena" },
  { id: 8, label: "Otro" }
];

export const MATERIAL_TECHOS = [
  { id: 1, label: "Losa o plancha de concreto" },
  { id: 2, label: "Teja de barro" },
  { id: 3, label: "Teja metálica (zinc)" },
  { id: 4, label: "Teja de fibrocemento (Eternit o similar)" },
  { id: 5, label: "Paja, palma u otros materiales vegetales" },
  { id: 6, label: "Materiales provisionales (cartón, plástico, tela, desechos)" },
  { id: 7, label: "Otro" }
];

export const FUENTE_AGUA = [
  { id: 1, label: "Acueducto público" },
  { id: 2, label: "Acueducto comunitario" },
  { id: 3, label: "Pozo con bomba" },
  { id: 4, label: "Pozo sin bomba, jagüey" },
  { id: 5, label: "Nacimiento o manantial" },
  { id: 6, label: "Agua lluvia" },
  { id: 7, label: "Río, quebrada, arroyo, canales" },
  { id: 8, label: "Carro tanque" },
  { id: 9, label: "Otro" }
];

export const DISPOSICION_EXCRETAS = [
  { id: 1, label: "Inodoro conectado a alcantarillado" },
  { id: 2, label: "Inodoro conectado a pozo séptico" },
  { id: 3, label: "Inodoro sin conexión (a pozo negro o directo a fuente de agua)" },
  { id: 4, label: "Letrina" },
  { id: 5, label: "No tiene servicio (campo abierto)" },
  { id: 6, label: "Otro" }
];

export const AGUAS_RESIDUALES = [
  { id: 1, label: "Alcantarillado" },
  { id: 2, label: "Pozo séptico" },
  { id: 3, label: "Campo abierto / suelo" },
  { id: 4, label: "Caño / acequia / río" },
  { id: 5, label: "Otro" }
];

export const DISPOSICION_RESIDUOS = [
  { id: 1, label: "Servicio público de recolección" },
  { id: 2, label: "Reciclaje" },
  { id: 3, label: "Lo entierran" },
  { id: 4, label: "Lo queman" },
  { id: 5, label: "Lo tiran al río o quebrada" },
  { id: 6, label: "Lo tiran al campo / patio" },
  { id: 7, label: "Otro" }
];

export const RIESGO_ACCIDENTE = [
  { id: 1, label: "Inundaciones" },
  { id: 2, label: "Deslizamientos" },
  { id: 3, label: "Incendios" },
  { id: 4, label: "Sismos" },
  { id: 5, label: "Presencia de minas o explosivos" },
  { id: 6, label: "Cercanía a cables de alta tensión" },
  { id: 7, label: "Estructuras de vivienda deterioradas" },
  { id: 8, label: "Ninguno" },
  { id: 9, label: "Otro" }
];

export const FUENTE_ENERGIA = [
  { id: 1, label: "Electricidad" },
  { id: 2, label: "Gas natural (red pública)" },
  { id: 3, label: "Gas licuado (propano en bombona)" },
  { id: 4, label: "Kerosene, petróleo" },
  { id: 5, label: "Carbón" },
  { id: 6, label: "Leña" },
  { id: 7, label: "Solar / Eólica" },
  { id: 8, label: "No tiene" },
  { id: 9, label: "Otro" }
];

export const ANIMALES = [
  { id: 1, label: "Perros" },
  { id: 2, label: "Gatos" },
  { id: 3, label: "Equinos (caballos, mulas)" },
  { id: 4, label: "Bovinos (vacas)" },
  { id: 5, label: "Ovino (ovejas)" },
  { id: 6, label: "Caprinos (cabras)" },
  { id: 7, label: "Porcinos (cerdos)" },
  { id: 8, label: "Aves de corral" },
  { id: 9, label: "Animales silvestres" },
  { id: 10, label: "Otros" }
];

export const TIPO_FAMILIA = [
  { id: 1, label: "Nuclear (Padres e hijos)" },
  { id: 2, label: "Monoparental (Uno de los padres e hijos)" },
  { id: 3, label: "Extendida (Padres, hijos y otros familiares)" },
  { id: 4, label: "Reconstituida (Padrastro/madrastra, hijos)" },
  { id: 5, label: "Unipersonal (Una sola persona)" },
  { id: 6, label: "Equivalente familiar (Compañeros de piso, etc.)" },
  { id: 7, label: "Otro" }
];

export const APGAR_PREGUNTAS = [
  "¿Le satisface la ayuda que recibe de su familia cuando tiene algún problema?",
  "¿Le satisface cómo su familia habla y comparte los problemas con usted?",
  "¿Le satisface cómo su familia acepta y apoya sus nuevos proyectos?",
  "¿Le satisface cómo su familia expresa afecto y responde a sus emociones?",
  "¿Le satisface cómo comparte su familia el tiempo, espacio y recursos?"
];

export const APGAR_OPCIONES = [
  { id: 1, label: "Funcional alta / Normal" },
  { id: 2, label: "Disfunción leve" },
  { id: 3, label: "Disfunción moderada" },
  { id: 4, label: "Disfunción severa" }
];

export const ZARIT_OPCIONES = [
  { id: 1, label: "Sin sobrecarga" },
  { id: 2, label: "Sobrecarga leve" },
  { id: 3, label: "Sobrecarga intensa" }
];

export const ECOMAPA_OPCIONES = [
  { id: 1, label: "Redes integradas / Relaciones fuertes" },
  { id: 2, label: "Relaciones débiles o distantes" },
  { id: 3, label: "Relaciones conflictivas" },
  { id: 4, label: "Sin redes de apoyo comunitarias" }
];

export const VULNERABILIDADES = [
  { id: 1, label: "Desplazamiento forzado" },
  { id: 2, label: "Víctima del conflicto armado" },
  { id: 3, label: "Pobreza extrema" },
  { id: 4, label: "Sin afiliación al sistema de salud" },
  { id: 5, label: "Analfabetismo" },
  { id: 6, label: "Ninguna" }
];

export const DIAGNOSTICO_NUTRICIONAL = [
  { id: 1, label: "Eutrófico (Normal)" },
  { id: 2, label: "Riesgo de desnutrición" },
  { id: 3, label: "Desnutrición aguda" },
  { id: 4, label: "Sobrepeso" },
  { id: 5, label: "Obesidad" }
];

export const PARENTESCO = [
  { id: 1, label: "Jefe de hogar" },
  { id: 2, label: "Cónyuge o compañero" },
  { id: 3, label: "Hijo(a)" },
  { id: 4, label: "Padre / Madre" },
  { id: 5, label: "Nieto(a)" },
  { id: 6, label: "Hermano(a)" },
  { id: 7, label: "Yerno / Nuera" },
  { id: 8, label: "Otro familiar" },
  { id: 9, label: "No familiar" }
];

export const REGIMEN_SALUD = [
  { id: "SUBSIDIADO", label: "Subsidiado" },
  { id: "CONTRIBUTIVO", label: "Contributivo" },
  { id: "ESPECIAL", label: "Especial (Fuerzas militares, etc.)" },
  { id: "EXCEPCION", label: "Excepción (Magisterio, etc.)" },
  { id: "NO_AFILIADO", label: "No afiliado" }
];

export const OCUPACION = [
  { id: 1, label: "Agricultor / Pescador" },
  { id: 2, label: "Ama de casa / Oficios del hogar" },
  { id: 3, label: "Estudiante" },
  { id: 4, label: "Empleado / Obrero" },
  { id: 5, label: "Trabajador independiente" },
  { id: 6, label: "Desempleado" },
  { id: 7, label: "Jubilado / Pensionado" },
  { id: 8, label: "Otro" }
];

export const TIPO_DOCUMENTO = [
  { id: "CC", label: "Cédula de Ciudadanía" },
  { id: "TI", label: "Tarjeta de Identidad" },
  { id: "RC", label: "Registro Civil" },
  { id: "CE", label: "Cédula de Extranjería" },
  { id: "NN", label: "Persona sin identificar" },
  { id: "PEP", label: "Permiso Especial de Permanencia" },
  { id: "PPT", label: "Permiso por Protección Temporal" }
];

export const SEXO = [
  { id: "HOMBRE", label: "Hombre" },
  { id: "MUJER", label: "Mujer" },
  { id: "INTERSEXUAL", label: "Intersexual" }
];

export const NIVEL_EDUCATIVO = [
  { id: 1, label: "Ninguno" },
  { id: 2, label: "Primaria incompleta" },
  { id: 3, label: "Primaria completa" },
  { id: 4, label: "Secundaria incompleta" },
  { id: 5, label: "Secundaria completa" },
  { id: 6, label: "Técnico / Tecnológico" },
  { id: 7, label: "Universitario" },
  { id: 8, label: "Postgrado" }
];

export const GRUPO_POBLACIONAL = [
  { id: 1, label: "Afrodescendiente / Afrocolombiano" },
  { id: 2, label: "Indígena" },
  { id: 3, label: "Rrom / Gitano" },
  { id: 4, label: "Palenquero" },
  { id: 5, label: "Raizal" },
  { id: 6, label: "Ninguno" }
];

export const BARRERAS_ACCESO = [
  { id: 1, label: "Geográficas / Transporte" },
  { id: 2, label: "Económicas" },
  { id: 3, label: "Administrativas (Trámites, EPS)" },
  { id: 4, label: "Culturales / Idioma" },
  { id: 5, label: "Ninguna" }
];

export const DISCAPACIDADES = [
  { id: 1, label: "Física (Movilidad)" },
  { id: 2, label: "Visual" },
  { id: 3, label: "Auditiva" },
  { id: 4, label: "Cognitiva / Intelectual" },
  { id: 5, label: "Mental / Psicosocial" },
  { id: 6, label: "Ninguna" }
];

export const ANTECEDENTES_CRONICOS = [
  { id: "HTA", label: "Hipertensión Arterial" },
  { id: "DM", label: "Diabetes Mellitus" },
  { id: "EPOC", label: "EPOC / Asma" },
  { id: "IRC", label: "Insuficiencia Renal" },
  { id: "CA", label: "Cáncer" },
  { id: "ECV", label: "Enfermedad Cardiovascular" }
];

export const ANTECEDENTES_TRANSMISIBLES = [
  { id: "TB", label: "Tuberculosis" },
  { id: "VIH", label: "VIH / SIDA" },
  { id: "LEP", label: "Lepra" },
  { id: "HEP", label: "Hepatitis B / C" },
  { id: "MAL", label: "Malaria / Dengue" }
];

export function calcularEdad(fechaNacStr: string): number {
  if (!fechaNacStr) return 0;
  const birthDate = new Date(fechaNacStr);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export const ETNIA = [
  { id: 1, label: "Indígena" },
  { id: 2, label: "Rrom (Gitano)" },
  { id: 3, label: "Raizal del archipiélago de San Andrés" },
  { id: 4, label: "Palenquero de San Basilio" },
  { id: 5, label: "Negro, Mulato, Afrocolombiano" },
  { id: 6, label: "Ninguno de los anteriores" }
];

export const INTERVENCIONES_PENDIENTES = [
  { id: 1, label: "Vacunación" },
  { id: 2, label: "Salud oral / Odontología" },
  { id: 3, label: "Planificación familiar" },
  { id: 4, label: "Control de crecimiento y desarrollo" },
  { id: 5, label: "Control prenatal" },
  { id: 6, label: "Tamizaje de cáncer (Cuello uterino/Mama/Próstata)" },
  { id: 7, label: "Ninguna" }
];

export const REMISIONES_SISTEMA = [
  { id: "MEDICINA_GENERAL", label: "Medicina General" },
  { id: "ODONTOLOGIA", label: "Odontología" },
  { id: "PSICOLOGIA", label: "Psicología" },
  { id: "TRABAJO_SOCIAL", label: "Trabajo Social" },
  { id: "ENFERMERIA", label: "Enfermería" },
  { id: "NUTRICION", label: "Nutrición" },
  { id: "MEDICINA_ESPECIALIZADA", label: "Medicina Especializada" },
  { id: "NINGUNA", label: "Ninguna" }
];

export const TIPO_DOCUMENTO_ENCUESTADOR = [
  { id: "CC", label: "Cédula de ciudadanía" },
  { id: "CE", label: "Cédula de Extranjería" },
  { id: "PPT", label: "Permiso por Protección Temporal (PPT)" }
];

export const PERFIL_ENCUESTADOR = [
  { id: "auxiliar", label: "Auxiliar de Campo" },
  { id: "profesional", label: "Profesional de Salud" },
  { id: "otro", label: "Otro" }
];

export const TERRITORIOS = [
  { id: "1", label: "Atrato Norte" },
  { id: "2", label: "Atrato Medio" },
  { id: "3", label: "Atrato Sur" }
];

export function getDocumentoDinamico(fechaNacStr: string, docActual: string): string {
  const edad = calcularEdad(fechaNacStr);
  if (edad < 7) return "RC";
  if (edad < 18) return "TI";
  return docActual || "CC";
}

export function calcularCursoVida(fechaNacStr: string): string {
  const edad = calcularEdad(fechaNacStr);
  if (edad <= 5) return "Primera Infancia";
  if (edad <= 11) return "Infancia";
  if (edad <= 17) return "Adolescencia";
  if (edad <= 28) return "Juventud";
  if (edad <= 59) return "Adultez";
  return "Vejez";
}

