import Dexie, { type Table } from 'dexie';

export interface LocalFichaHogar {
  id: string; // uuid
  estadoVisita: string;
  departamento: string;
  municipio: string;
  territorioId?: string;
  uzpe?: string;
  centroPoblado?: string;
  descripcionUbicacion?: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  fechaDiligenciamiento: string;
  encuestadorId?: string;
  numEBS?: string;
  equipoTerritorio?: string;
  observacionesRechazo?: string;
  numHogar?: string;
  numFamilia?: string;
  codFicha?: string;
  
  // Vivienda
  tipoVivienda?: number;
  tipoViviendaDesc?: string;
  matParedes?: number;
  matPisos?: number;
  matTechos?: number;
  numHogares?: number;
  numDormitorios?: number;
  estratoSocial?: number;
  hacinamiento: boolean;
  fuenteAgua: number[];
  dispExcretas: number[];
  aguasResiduales: number[];
  dispResiduos: number[];
  riesgoAccidente: number[];
  fuenteEnergia?: number;
  presenciaVectores: boolean;
  animales: number[];
  cantAnimales?: number;
  vacunacionMascotas: boolean;
  
  // Familia
  tipoFamilia?: number;
  numIntegrantes: number;
  apgar?: number;
  apgarRespuestas: number[];
  ecomapa?: number;
  cuidadorPrincipal: boolean;
  zarit?: number;
  vulnerabilidades: number[];
  familiogramaCodigo?: string;
  otrosJson?: any;
  integrantes: LocalPaciente[]; // nested for easier offline handling
}

export interface LocalPaciente {
  id: string;
  fichaId?: string;
  nombres: string;
  apellidos: string;
  tipoDoc: string;
  documento: string;
  fechaNacimiento: string;
  parentesco: number;
  sexo: string;
  gestante: string;
  mesesGestacion?: number;
  telefono?: string;
  direccion: string;
  nivelEducativo?: number;
  ocupacion?: number;
  regimen?: string;
  eapb?: string;
  etnia?: number;
  puebloIndigena?: string;
  grupoPoblacional: number[];
  barrerasAcceso: number[];
  discapacidades: number[];
  antecedentes?: any;
  antecTransmisibles?: any;
  peso?: number;
  talla?: number;
  perimetroBraquial?: number;
  diagNutricional?: number;
  presionArterial?: string;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  saturacionOxigeno?: number;
  perimetroCefalico?: number;
  tipoCancer?: string;
  riesgoMetalesPesados?: any;
  practicaDeportiva: boolean;
  lactanciaMaterna: boolean;
  lactanciaMeses?: number;
  esquemaAtenciones: boolean;
  esquemaVacunacion: boolean;
  intervencionesPendientes: number[];
  enfermedadAguda: boolean;
  recibeAtencionMedica: boolean;
  remisiones: string[];
  barrerasAccesoOtro?: string;
  otrosJson?: any;
}

export interface LocalAtencion {
  id: string;
  pacienteId: string;
  pacienteDocumento: string; // index for offline retrieval
  pacienteNombre: string;
  profesionalId: string;
  programaId: string;
  nota: any;
  territorioId?: string;
  createdAt: string;
}

export interface LocalDerivacion {
  id: string;
  pacienteId: string;
  pacienteDocumento: string;
  profesionalId: string;
  programaId: string;
  territorioId?: string;
  motivo: string;
  diagnostico?: string;
  destino?: string;
  observaciones?: string;
  estado: string;
  createdAt: string;
}

export interface SyncItem {
  id?: number; // autoincrement local ID
  type: 'FICHA_HOGAR' | 'ATENCION' | 'DERIVACION';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  error?: string;
}

class PopulationOfflineDB extends Dexie {
  fichas!: Table<LocalFichaHogar>;
  atenciones!: Table<LocalAtencion>;
  derivaciones!: Table<LocalDerivacion>;
  syncQueue!: Table<SyncItem>;

  constructor() {
    super('SistemaGestionPoblacionalOffline');
    this.version(1).stores({
      fichas: 'id, estadoVisita, direccion, fechaDiligenciamiento',
      atenciones: 'id, pacienteId, pacienteDocumento, profesionalId, programaId, createdAt',
      derivaciones: 'id, pacienteId, pacienteDocumento, profesionalId, programaId, estado, createdAt',
      syncQueue: '++id, type, action, status, createdAt'
    });
  }
}

export const localDB = new PopulationOfflineDB();
export default localDB;
