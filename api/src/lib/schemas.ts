import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Fuente de verdad de forma: docs/api-contract.md §0-§1 y apps/web/src/types.ts.

export const RolSchema = z.enum(['ADMIN', 'USUARIO']).openapi('Rol');
export const EstadoSchema = z
  .enum(['POR_HACER', 'EN_PROGRESO', 'REVIEW', 'TERMINADO'])
  .openapi('Estado');
export const PrioridadSchema = z.enum(['BAJA', 'MEDIA', 'ALTA']).openapi('Prioridad');

export const UsuarioResumenSchema = z
  .object({
    id: z.string().openapi({ example: 'user-1' }),
    email: z.string().openapi({ example: 'lucia.fernandez@example.com' }),
    nombre: z.string().openapi({ example: 'Lucía Fernández' }),
    rol: RolSchema,
    activo: z.boolean(),
  })
  .openapi('UsuarioResumen');

export const UsuarioBasicoSchema = z
  .object({
    id: z.string(),
    nombre: z.string(),
    email: z.string(),
  })
  .openapi('UsuarioBasico');

export const EtiquetaSchema = z
  .object({ id: z.string().openapi({ example: 'bd-etq-1' }), nombre: z.string() })
  .openapi('Etiqueta');

export const ResponsableSchema = z
  .object({ userId: z.string(), user: UsuarioBasicoSchema })
  .openapi('Responsable');

export const ProyectoSchema = z
  .object({
    id: z.string().openapi({ example: 'bd-proy-1' }),
    nombre: z.string(),
    descripcion: z.string().nullable(),
    creadorId: z.string(),
    creador: UsuarioBasicoSchema,
    creadoEn: z.string().openapi({ description: 'ISO 8601' }),
    ticketsAbiertos: z.number().int().openapi({
      description: 'Calculado: tickets no archivados con estado distinto de TERMINADO.',
    }),
  })
  .openapi('Proyecto');

export const TicketSchema = z
  .object({
    id: z.string().openapi({ example: 'bd-tk-1' }),
    titulo: z.string(),
    descripcion: z.string().nullable(),
    estado: EstadoSchema,
    prioridad: PrioridadSchema,
    fecha: z.string().nullable().openapi({ description: 'Fecha opcional (YYYY-MM-DD).' }),
    proyectoId: z.string(),
    creadorId: z.string(),
    creador: UsuarioBasicoSchema,
    archivado: z.boolean(),
    archivadoPorId: z.string().nullable(),
    creadoEn: z.string(),
    actualizadoEn: z.string(),
    cerradoEn: z.string().nullable(),
    responsables: z.array(ResponsableSchema),
    etiquetas: z.array(EtiquetaSchema),
  })
  .openapi('Ticket');

// --- Errores (RFC 7807) y envelope ------------------------------------------

export const ProblemDetailsSchema = z
  .object({
    type: z.string().openapi({ example: 'https://minijira.dev/errors/validation' }),
    title: z.string().openapi({ example: 'Validation Failed' }),
    status: z.number().int().openapi({ example: 400 }),
    detail: z.string(),
    instance: z.string().openapi({ description: 'Path de la request.' }),
    errors: z
      .array(z.object({ field: z.string(), message: z.string() }))
      .optional()
      .openapi({ description: 'Solo en 400 de validación.' }),
  })
  .openapi('ProblemDetails');

/** Envelope { data, error } de api-contract.md §0. */
export function envelope<T extends z.ZodType>(name: string, data: T) {
  return z
    .object({ data: data.nullable(), error: ProblemDetailsSchema.nullable() })
    .openapi(name);
}

export function pageOf<T extends z.ZodType>(name: string, item: T) {
  return z
    .object({
      items: z.array(item),
      nextCursor: z.string().nullable().openapi({ description: 'null = no hay más páginas.' }),
    })
    .openapi(name);
}

// --- Requests ---------------------------------------------------------------

export const LoginBodySchema = z
  .object({
    email: z.string().min(1, 'El email es obligatorio.').openapi({ example: 'lucia.fernandez@example.com' }),
    password: z.string().min(1, 'La contraseña es obligatoria.').openapi({ example: 'MiniJira2026!' }),
  })
  .openapi('LoginBody');

export const LoginResponseSchema = z
  .object({ token: z.string(), user: UsuarioResumenSchema })
  .openapi('LoginResponse');

export const MeQuerySchema = z.object({
  userId: z.string({ error: 'userId es obligatorio.' }).min(1, 'userId es obligatorio.').openapi({
    description:
      'TEMPORAL (fase sin autenticación): identifica al usuario porque no hay token. Se elimina cuando se implemente Authorization: Bearer.',
    example: 'user-1',
  }),
});

export const PageQuerySchema = z.object({
  cursor: z.string().optional().openapi({ description: 'Cursor opaco devuelto en nextCursor.' }),
  limit: z.coerce
    .number()
    .int('limit debe ser un entero.')
    .min(1, 'limit mínimo 1.')
    .max(100, 'limit máximo 100.')
    .default(20)
    .openapi({ description: 'Tamaño de página (default 20, máx. 100).', example: 20 }),
});

export const ProjectIdParamSchema = z.object({
  projectId: z.string().min(1).openapi({ example: 'bd-proy-1' }),
});

export const TicketParamsSchema = ProjectIdParamSchema.extend({
  ticketId: z.string().min(1).openapi({ example: 'bd-tk-1' }),
});

export const PatchTicketBodySchema = z
  .object({
    estado: EstadoSchema.optional(),
    titulo: z.string().trim().min(1, 'El título es obligatorio.').optional(),
    descripcion: z.string().nullable().optional(),
    prioridad: PrioridadSchema.optional(),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD.')
      .nullable()
      .optional(),
    etiquetas: z
      .array(z.string().min(1))
      .optional()
      .openapi({ description: 'IDs de etiquetas (reemplaza el conjunto actual).', example: ['bd-etq-1'] }),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Debes enviar al menos un campo a actualizar.' })
  .openapi('PatchTicketBody');

// =============================================================================
// P1 / P2. Fase sin autenticación: los campos marcados TEMPORAL sustituyen al
// "usuario autenticado" del contrato y se eliminan cuando exista Authorization.
// =============================================================================

const TEMP_NOTE = 'TEMPORAL (fase sin autenticación): sustituye al usuario autenticado.';

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD.');

export const ComentarioSchema = z
  .object({
    id: z.string(),
    ticketId: z.string(),
    autorId: z.string(),
    autor: UsuarioBasicoSchema,
    contenido: z.string(),
    creadoEn: z.string().openapi({ description: 'ISO 8601' }),
  })
  .openapi('Comentario');

export const ReporteCierreSchema = z
  .object({
    proyectoId: z.string(),
    proyecto: z.string(),
    mes: z.number().int().openapi({ example: 9 }),
    anio: z.number().int().openapi({ example: 2026 }),
    cantidad: z.number().int(),
  })
  .openapi('ReporteCierre');

export const CreateProjectBodySchema = z
  .object({
    nombre: z.string({ error: 'El nombre es obligatorio.' }).trim().min(1, 'El nombre es obligatorio.').openapi({ example: 'Nuevo proyecto' }),
    descripcion: z.string().nullable().optional(),
    creadorId: z.string({ error: 'creadorId es obligatorio.' }).min(1, 'creadorId es obligatorio.').openapi({ description: TEMP_NOTE, example: 'user-1' }),
  })
  .openapi('CreateProjectBody');

export const PatchProjectBodySchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio.').optional(),
    descripcion: z.string().nullable().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Debes enviar al menos un campo a actualizar.' })
  .openapi('PatchProjectBody');

export const CreateTicketBodySchema = z
  .object({
    titulo: z.string({ error: 'El título es obligatorio.' }).trim().min(1, 'El título es obligatorio.').openapi({ example: 'Nuevo ticket' }),
    descripcion: z.string().nullable().optional(),
    prioridad: PrioridadSchema.optional(),
    fecha: fechaSchema.nullable().optional(),
    etiquetas: z.array(z.string().min(1)).optional().openapi({ description: 'IDs de etiquetas.' }),
    creadorId: z.string({ error: 'creadorId es obligatorio.' }).min(1, 'creadorId es obligatorio.').openapi({ description: TEMP_NOTE, example: 'user-1' }),
  })
  .openapi('CreateTicketBody');

export const ArchiveQuerySchema = z.object({
  actorId: z.string().min(1).optional().openapi({
    description: `${TEMP_NOTE} Se guarda como archivadoPorId. Opcional.`,
    example: 'user-1',
  }),
});

export const AddResponsableBodySchema = z
  .object({ userId: z.string({ error: 'userId es obligatorio.' }).min(1, 'userId es obligatorio.').openapi({ example: 'user-2' }) })
  .openapi('AddResponsableBody');

export const CreateComentarioBodySchema = z
  .object({
    contenido: z.string({ error: 'El comentario no puede estar vacío.' }).trim().min(1, 'El comentario no puede estar vacío.').openapi({ example: 'Revisado, listo para QA.' }),
    autorId: z.string({ error: 'autorId es obligatorio.' }).min(1, 'autorId es obligatorio.').openapi({ description: TEMP_NOTE, example: 'user-1' }),
  })
  .openapi('CreateComentarioBody');

export const ListTicketsQuerySchema = PageQuerySchema.extend({
  proyectoId: z.string().min(1).optional(),
  prioridad: PrioridadSchema.optional(),
  responsableId: z.string().min(1).optional().openapi({ description: 'ID de usuario responsable.' }),
  etiqueta: z.string().min(1).optional().openapi({ description: 'ID de etiqueta.' }),
  fechaDesde: fechaSchema.optional().openapi({ description: 'YYYY-MM-DD, inclusive.' }),
  fechaHasta: fechaSchema.optional().openapi({ description: 'YYYY-MM-DD, inclusive.' }),
});

export const ClosedTicketsQuerySchema = z.object({
  mes: z.coerce.number().int('mes debe ser un entero.').min(1, 'mes entre 1 y 12.').max(12, 'mes entre 1 y 12.').optional(),
  anio: z.coerce.number().int('anio debe ser un entero.').min(2000, 'anio inválido.').max(2100, 'anio inválido.').optional(),
  proyectoId: z.string().min(1).optional(),
});

export const TicketCommentParamsSchema = TicketParamsSchema;

export const LogoutResponseSchema = z.object({ ok: z.boolean() }).openapi('LogoutResponse');
