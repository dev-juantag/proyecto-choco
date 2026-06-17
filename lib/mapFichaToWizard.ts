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
    prestadorPrimario: cleanVal(ficha.prestadorPrimario || "ESE SALUD PAIMADO"),
    perfilEncuestador: cleanVal(ficha.perfilEncuestador || perfilEncuestador),
    tipoDocEncuestador: cleanVal(ficha.tipoDocEncuestador || "CC"),
    numDocEncuestador: cleanVal(ficha.numDocEncuestador || encuestadorDoc),
    microterritorio: cleanVal(ficha.microterritorio || "MT01"),
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
    numHogares: cleanVal(ficha.numHogares || 1),
    numDormitorios: cleanVal(ficha.numDormitorios || 1),
    estratoSocial: cleanVal(ficha.estratoSocial || 1),
    hacinamiento: Boolean(ficha.hacinamiento),
    fuenteAgua: getIntList(ficha.fuenteAgua),
    dispExcretas: getIntList(ficha.dispExcretas),
    aguasResiduales: getIntList(ficha.aguasResiduales),
    dispResiduos: getIntList(ficha.dispResiduos),
    riesgoAccidente: getIntList(ficha.riesgoAccidente),
    fuenteEnergia: cleanVal(ficha.fuenteEnergia),
    presenciaVectores: Boolean(ficha.presenciaVectores),
    animales: getIntList(ficha.animales),
    cantAnimales: cleanVal(ficha.cantAnimales),
    vacunacionMascotas: Boolean(ficha.vacunacionMascotas),

    // Familia
    tipoFamilia: cleanVal(ficha.tipoFamilia),
    numIntegrantes: cleanVal(ficha.numIntegrantes || "1"),
    apgar: cleanVal(ficha.apgar),
    apgarRespuestas: getIntList(ficha.apgarRespuestas),
    ecomapa: cleanVal(ficha.ecomapa),
    cuidadorPrincipal: Boolean(ficha.cuidadorPrincipal),
    zarit: cleanVal(ficha.zarit),
    vulnerabilidades: getIntList(ficha.vulnerabilidades),

    integrantes: Array.isArray(ficha.pacientes)
      ? ficha.pacientes.map((p: any) => ({
          id: p.id,
          primerNombre: p.nombres ? p.nombres.split(" ")[0] : "",
          segundoNombre: p.nombres && p.nombres.split(" ").length > 1 ? p.nombres.split(" ").slice(1).join(" ") : "",
          primerApellido: p.apellidos ? p.apellidos.split(" ")[0] : "",
          segundoApellido: p.apellidos && p.apellidos.split(" ").length > 1 ? p.apellidos.split(" ").slice(1).join(" ") : "",
          tipoDoc: cleanVal(p.tipoDoc || "CC"),
          numDoc: cleanVal(p.documento),
          fechaNacimiento: cleanVal(p.fechaNacimiento),
          parentesco: cleanVal(p.parentesco || 1),
          sexo: cleanVal(p.sexo || "HOMBRE"),
          gestante: cleanVal(p.gestante || "NA"),
          mesesGestacion: cleanVal(p.mesesGestacion),
          telefono: cleanVal(p.telefono),
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
