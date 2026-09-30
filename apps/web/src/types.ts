// Modelo de datos del frontend — subconjunto vigente en docs/frontend-specs.md §3.
// Se amplía (Ticket, Comentario, Etiqueta, Estado, Prioridad) cuando se
// construya el tablero; no se anticipan campos aquí.

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
