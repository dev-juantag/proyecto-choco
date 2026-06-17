export interface Paciente {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDoc: string;
  documento: string;
  fechaNacimiento: string;
  sexo: string;
  telefono?: string;
  direccion: string;
  regimen?: string;
  eapb?: string;
  createdAt?: string;
  nombreCompleto?: string;
  tipoDocumento?: string;
  tipoDocumentoDinamico?: string;
  genero?: string;
}

export const GENEROS = [
  { id: "HOMBRE", label: "Hombre" },
  { id: "MUJER", label: "Mujer" },
  { id: "INTERSEXUAL", label: "Intersexual" }
];

export interface Atencion {
  id: string;
  fecha: string;
  createdAtISO?: string;
  pacienteNombre: string;
  pacienteDocumento: string;
  pacienteTipoDoc: string;
  pacienteGenero: string;
  pacienteTelefono?: string;
  pacienteDireccion: string;
  pacienteFechaNac: string;
  pacienteRegimen?: string;
  pacienteEapb?: string;
  programaId: string;
  profesionalId: string;
  profesionalNombre: string;
  notaValoracion: string;
  estadoFacturacion: string;
  observacionFacturacion?: string;
}
