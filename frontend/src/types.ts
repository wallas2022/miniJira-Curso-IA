export type Rol = 'ADMIN' | 'USUARIO';
export type Estado = 'POR_HACER' | 'EN_PROGRESO' | 'REVIEW' | 'TERMINADO';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface AuthUser {
  id: string;
  email: string;
  rol: Rol;
}

export interface UsuarioResumen {
  id: string;
  email: string;
  rol: Rol;
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  creadoEn: string;
  creadorId: string;
  _count?: { tickets: number };
}

export interface Ticket {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: Estado;
  prioridad: Prioridad;
  archivado: boolean;
  proyectoId: string;
  creadorId: string;
  creador: { id: string; email: string };
  archivadoPorId: string | null;
  creadoEn: string;
  actualizadoEn: string;
  cerradoEn: string | null;
  responsables: { userId: string; user: { id: string; email: string } }[];
}
