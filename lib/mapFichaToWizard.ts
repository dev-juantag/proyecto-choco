export function mapFichaToWizardData(ficha: any, encuestadorDoc: string, perfilEncuestador: string): any {
  if (!ficha) return null;

  const getIntList = (val: any): number[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v: any) => Number(v));
    return [];
  };

  const cleanVal = (val: any): string => {
    if (val === null || val === undefined) return "";
    return String(val);
  };

  return {
    estadoVisita: cleanVal(ficha.estadoVisita || "1"),
    fechaDiligenciamiento: cleanVal(ficha.fechaDiligenciamiento ? ficha.fechaDiligenciamiento.split("T")[0] : ""),
    uzpe: cleanVal(ficha.uzpe || "UZPE011"),
    departamento: cleanVal(ficha.departamento || "CHOCO"),
    municipio: cleanVal(ficha.municipio || "PAIMADO"),
    centroPoblado: cleanVal(ficha.centroPoblado),
    direccion: cleanVal(ficha.direccion),
    latitud: ficha.latitud,
    longitud: ficha.longitud,
    numEBS: cleanVal(ficha.numEBS),
    equipoTerritorio: cleanVal(ficha.equipoTerritorio),
    perfilEncuestador: cleanVal(ficha.perfilEncuestador || perfilEncuestador),
    tipoDocEncuestador: cleanVal(ficha.tipoDocEncuestador || "CC"),
    numDocEncuestador: cleanVal(ficha.numDocEncuestador || encuestadorDoc),
    observacionesRechazo: cleanVal(ficha.observacionesRechazo),
    
    // Vivienda
    numHogar: cleanVal(ficha.numHogar),
    numFamilia: cleanVal(ficha.numFamilia),
    codFicha: cleanVal(ficha.codFicha),
    tipoVivienda: cleanVal(ficha.tipoVivienda),
    tipoViviendaDesc: cleanVal(ficha.tipoViviendaDesc),
    matParedes: cleanVal(ficha.matParedes),
    matPisos: cleanVal(ficha.matPisos),
    matTechos: cleanVal(ficha.matTechos),
    estadoParedes: cleanVal(ficha.otrosJson?.estadoParedes || ficha.estadoParedes),
    estadoPisos: cleanVal(ficha.otrosJson?.estadoPisos || ficha.estadoPisos),
    estadoTechos: cleanVal(ficha.otrosJson?.estadoTechos || ficha.estadoTechos),
    estadoBano: cleanVal(ficha.otrosJson?.estadoBano || ficha.estadoBano),
    estadoCocina: cleanVal(ficha.otrosJson?.estadoCocina || ficha.estadoCocina),
    observacionesInmueble: cleanVal(ficha.otrosJson?.observacionesInmueble || ficha.observacionesInmueble),
    numHogares: cleanVal(ficha.numHogares || 1),
    numDormitorios: cleanVal(ficha.numDormitorios || 1),
    estratoSocial: cleanVal(ficha.estratoSocial || 1),
    hacinamiento: Boolean(ficha.hacinamiento),
    fuenteAgua: getIntList(ficha.fuenteAgua),
    fuenteAguaTratamiento: cleanVal(ficha.otrosJson?.fuenteAguaTratamiento || ficha.fuenteAguaTratamiento),
    dispExcretas: getIntList(ficha.dispExcretas),
    aguasResiduales: getIntList(ficha.aguasResiduales),
    dispResiduos: getIntList(ficha.dispResiduos),
    riesgoAccidente: getIntList(ficha.riesgoAccidente),
    riesgosCambioClimatico: getIntList(ficha.otrosJson?.riesgosCambioClimatico || ficha.riesgosCambioClimatico),
    fuenteEnergia: cleanVal(ficha.fuenteEnergia),
    presenciaVectores: Boolean(ficha.presenciaVectores),
    animales: getIntList(ficha.animales),
    cantAnimales: cleanVal(ficha.cantAnimales),
    vacunacionMascotas: Boolean(ficha.vacunacionMascotas),

    // Familia
    tipoFamilia: cleanVal(ficha.tipoFamilia),
    numIntegrantes: cleanVal(ficha.numIntegrantes || "1"),
    numIntegrantesMineria: cleanVal(ficha.otrosJson?.numIntegrantesMineria || ficha.numIntegrantesMineria || "0"),
    apgar: cleanVal(ficha.apgar),
    apgarRespuestas: getIntList(ficha.apgarRespuestas),
    ecomapa: cleanVal(ficha.ecomapa),
    ecomapaRespuestas: getIntList(ficha.ecomapaRespuestas),
    cuidadorPrincipal: Boolean(ficha.cuidadorPrincipal),
    zarit: cleanVal(ficha.zarit),
    zaritRespuestas: getIntList(ficha.zaritRespuestas),
    vulnerabilidades: getIntList(ficha.vulnerabilidades),
    consentimiento: ficha.consentimiento || null,

    integrantes: Array.isArray(ficha.pacientes)
      ? ficha.pacientes.map((p: any) => ({
          id: p.id,
          nombres: cleanVal(p.nombres),
          apellidos: cleanVal(p.apellidos),
          datosDesconocidos: p.tipoDoc === "NN" && (p.documento?.startsWith("SD-") || false),
          tipoDoc: cleanVal(p.tipoDoc || "CC"),
          numDoc: cleanVal(p.documento),
          fechaNacimiento: cleanVal(p.fechaNacimiento),
          parentesco: cleanVal(p.parentesco || 1),
          sexo: cleanVal(p.sexo || "HOMBRE"),
          gestante: cleanVal(p.gestante || "NA"),
          mesesGestacion: cleanVal(p.mesesGestacion),
          telefono: cleanVal(p.telefono),
          direccion: cleanVal(p.direccion),
          nivelEducativo: cleanVal(p.nivelEducativo),
          ocupacion: cleanVal(p.ocupacion),
          regimen: cleanVal(p.regimen),
          eapb: cleanVal(p.eapb),
          etnia: cleanVal(p.etnia),
          puebloIndigena: cleanVal(p.puebloIndigena),
          grupoPoblacional: getIntList(p.grupoPoblacional),
          discapacidades: getIntList(p.discapacidades),
          padreId: cleanVal(p.padreId),
          madreId: cleanVal(p.madreId),
          parejaId: cleanVal(p.parejaId),
          tipoPareja: cleanVal(p.tipoPareja || "UNION_LIBRE"),
          tipoHijo: cleanVal(p.tipoHijo || "BIOLOGICO"),
          estadoVital: cleanVal(p.estadoVital || "VIVO"),
          
          antecedentes: p.antecedentes || {},
          antecTransmisibles: p.antecTransmisibles || {},
          peso: cleanVal(p.peso),
          talla: cleanVal(p.talla),
          perimetroBraquial: cleanVal(p.perimetroBraquial),
          diagNutricional: cleanVal(p.diagNutricional),
          presionArterial: cleanVal(p.presionArterial),
          frecuenciaCardiaca: cleanVal(p.frecuenciaCardiaca),
          frecuenciaRespiratoria: cleanVal(p.frecuenciaRespiratoria),
          saturacionOxigeno: cleanVal(p.saturacionOxigeno),
          perimetroCefalico: cleanVal(p.perimetroCefalico),
          perimetroAbdominal: cleanVal(p.perimetroAbdominal),
          tipoCancer: cleanVal(p.tipoCancer),
          riesgoMetalesPesados: p.riesgoMetalesPesados || null,
          practicaDeportiva: Boolean(p.practicaDeportiva),
          lactanciaMaterna: Boolean(p.lactanciaMaterna),
          lactanciaMeses: cleanVal(p.lactanciaMeses),
          esquemaAtenciones: Boolean(p.esquemaAtenciones),
          esquemaVacunacion: Boolean(p.esquemaVacunacion),
          intervencionesPendientes: getIntList(p.intervencionesPendientes),
          enfermedadAguda: Boolean(p.enfermedadAguda),
          recibeAtencionMedica: Boolean(p.recibeAtencionMedica),
          remisiones: Array.isArray(p.remisiones) ? p.remisiones.map((r: any) => String(r)) : [],
        }))
      : []
  };
}
export default mapFichaToWizardData;
