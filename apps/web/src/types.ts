// Modelo de datos del frontend — subconjunto vigente en docs/frontend-specs.md §3.

export type Rol = 'ADMIN' | 'USUARIO';

export interface UsuarioResumen {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  creadorId: string;
  creador: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
  creadoEn: string; // ISO 8601
  ticketsAbiertos: number;
}

export type Estado = 'POR_HACER' | 'EN_PROGRESO' | 'REVIEW' | 'TERMINADO'; // orden fijo, decisión #2 (R-07)
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface Etiqueta {
  id: string;
  nombre: string;
}

export interface Responsable {
  userId: string;
  user: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
}

export interface Ticket {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: Estado;
  prioridad: Prioridad;
  fecha: string | null; // ISO 8601, vencimiento opcional
  proyectoId: string;
  creadorId: string;
  creador: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
  archivado: boolean;
  archivadoPorId: string | null;
  creadoEn: string; // ISO 8601
  actualizadoEn: string; // ISO 8601
  cerradoEn: string | null; // ISO 8601, se fija al pasar a TERMINADO
  responsables: Responsable[];
  etiquetas: Etiqueta[];
}
