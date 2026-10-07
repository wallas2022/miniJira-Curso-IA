import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  envelope,
  pageOf,
  LoginBodySchema,
  LoginResponseSchema,
  MeQuerySchema,
  UsuarioResumenSchema,
  PageQuerySchema,
  ProjectIdParamSchema,
  TicketParamsSchema,
  PatchTicketBodySchema,
  ProyectoSchema,
  TicketSchema,
  ComentarioSchema,
  ReporteCierreSchema,
  LogoutResponseSchema,
  CreateProjectBodySchema,
  PatchProjectBodySchema,
  CreateTicketBodySchema,
  ArchiveQuerySchema,
  AddResponsableBodySchema,
  CreateComentarioBodySchema,
  ListTicketsQuerySchema,
  ClosedTicketsQuerySchema,
} from '@/lib/schemas';

// Nota: no importar nada que toque Supabase aquí; el spec debe poder generarse sin credenciales.

export const LoginResponseEnvelope = envelope('LoginResponseEnvelope', LoginResponseSchema);
export const UsuarioEnvelope = envelope('UsuarioResumenEnvelope', UsuarioResumenSchema);
export const ProyectoPageEnvelope = envelope('ProyectoPageEnvelope', pageOf('ProyectoPage', ProyectoSchema));
export const TicketPageEnvelope = envelope('TicketPageEnvelope', pageOf('TicketPage', TicketSchema));
export const TicketEnvelope = envelope('TicketEnvelope', TicketSchema);

const ErrorEnvelope = envelope('ErrorEnvelope', z.null());

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorEnvelope } },
});

const ok = (description: string, schema: z.ZodType) => ({
  description,
  content: { 'application/json': { schema } },
});

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Iniciar sesión (P0, H1)',
  description:
    'Verifica email/contraseña. FASE SIN AUTENTICACIÓN: el `token` devuelto es un marcador fijo, no un JWT, y ningún otro endpoint lo exige.',
  request: { body: { required: true, content: { 'application/json': { schema: LoginBodySchema } } } },
  responses: {
    200: ok('Credenciales válidas.', LoginResponseEnvelope),
    400: errorResponse('Validación fallida.'),
    401: errorResponse('Credenciales incorrectas (mensaje genérico).'),
    500: errorResponse('Error interno (mensaje genérico).'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Usuario actual (P0, H1)',
  description:
    'FASE SIN AUTENTICACIÓN: sin token no hay "usuario actual", así que se identifica con el query param temporal `userId`.',
  request: { query: MeQuerySchema },
  responses: {
    200: ok('Usuario.', UsuarioEnvelope),
    400: errorResponse('Validación fallida.'),
    404: errorResponse('Usuario no encontrado.'),
    500: errorResponse('Error interno (mensaje genérico).'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/projects',
  tags: ['Projects'],
  summary: 'Listar proyectos (P0, H2)',
  description:
    'FASE SIN AUTENTICACIÓN: devuelve todos los proyectos (visibilidad de Admin); la restricción por usuario llega con auth.',
  request: { query: PageQuerySchema },
  responses: {
    200: ok('Página de proyectos.', ProyectoPageEnvelope),
    400: errorResponse('Validación fallida.'),
    500: errorResponse('Error interno (mensaje genérico).'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/projects/{projectId}/tickets',
  tags: ['Tickets'],
  summary: 'Listar tickets de un proyecto (P0, H6)',
  description: 'Excluye tickets archivados.',
  request: { params: ProjectIdParamSchema, query: PageQuerySchema },
  responses: {
    200: ok('Página de tickets.', TicketPageEnvelope),
    400: errorResponse('Validación fallida.'),
    404: errorResponse('Proyecto no encontrado.'),
    500: errorResponse('Error interno (mensaje genérico).'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/projects/{projectId}/tickets/{ticketId}',
  tags: ['Tickets'],
  summary: 'Actualizar un ticket (P0, H3/H6)',
  description:
    'Actualización parcial, last-write-wins. Si `estado` pasa a TERMINADO se fija `cerradoEn`; siempre se actualiza `actualizadoEn`. FASE SIN AUTENTICACIÓN: sin chequeo de permisos.',
  request: {
    params: TicketParamsSchema,
    body: { required: true, content: { 'application/json': { schema: PatchTicketBodySchema } } },
  },
  responses: {
    200: ok('Ticket actualizado.', TicketEnvelope),
    400: errorResponse('Validación fallida.'),
    404: errorResponse('Ticket no encontrado.'),
    500: errorResponse('Error interno (mensaje genérico).'),
  },
});

// =============================================================================
// P1 / P2 — fase sin autenticación. Los campos "TEMPORAL" (creadorId, autorId,
// actorId) sustituyen al usuario autenticado y se eliminan cuando exista auth.
// =============================================================================

const ProyectoEnvelope = envelope('ProyectoEnvelope', ProyectoSchema);
const ComentarioPageEnvelope = envelope('ComentarioPageEnvelope', pageOf('ComentarioPage', ComentarioSchema));
const ComentarioEnvelope = envelope('ComentarioEnvelope', ComentarioSchema);
const ReporteEnvelope = envelope('ReporteCierreEnvelope', z.array(ReporteCierreSchema));
const LogoutEnvelope = envelope('LogoutEnvelope', LogoutResponseSchema);

const jsonBody = (schema: z.ZodType) => ({
  required: true,
  content: { 'application/json': { schema } },
});
const e400 = errorResponse('Validación fallida.');
const e500 = errorResponse('Error interno (mensaje genérico).');

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Cerrar sesión (P2, H1)',
  description: 'FASE SIN AUTENTICACIÓN: no hay token que invalidar; responde `ok: true`.',
  responses: { 200: ok('Sesión cerrada.', LogoutEnvelope), 500: e500 },
});

registry.registerPath({
  method: 'post',
  path: '/projects',
  tags: ['Projects'],
  summary: 'Crear proyecto (P1, H2)',
  description: '`creadorId` es TEMPORAL y sustituye al usuario autenticado.',
  request: { body: jsonBody(CreateProjectBodySchema) },
  responses: { 200: ok('Proyecto creado.', ProyectoEnvelope), 400: e400, 500: e500 },
});

registry.registerPath({
  method: 'patch',
  path: '/projects/{projectId}',
  tags: ['Projects'],
  summary: 'Editar proyecto (P1, H2)',
  description: 'Actualización parcial. Sin chequeo de "solo el creador" en esta fase.',
  request: { params: ProjectIdParamSchema, body: jsonBody(PatchProjectBodySchema) },
  responses: {
    200: ok('Proyecto actualizado.', ProyectoEnvelope),
    400: e400,
    404: errorResponse('Proyecto no encontrado.'),
    500: e500,
  },
});

registry.registerPath({
  method: 'post',
  path: '/projects/{projectId}/tickets',
  tags: ['Tickets'],
  summary: 'Crear ticket (P1, H3)',
  description:
    'Estado inicial `POR_HACER`. `creadorId` es TEMPORAL y sustituye al usuario autenticado. Falta de `titulo` → 400 con `errors[{field:"titulo"}]`.',
  request: { params: ProjectIdParamSchema, body: jsonBody(CreateTicketBodySchema) },
  responses: {
    200: ok('Ticket creado.', TicketEnvelope),
    400: e400,
    404: errorResponse('Proyecto no encontrado.'),
    500: e500,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/projects/{projectId}/tickets/{ticketId}',
  tags: ['Tickets'],
  summary: 'Archivar ticket (P1, H4)',
  description:
    'Archivado lógico (`archivado = true`), nunca borrado físico. `actorId` (query, TEMPORAL) se guarda como `archivadoPorId`. Idempotente.',
  request: { params: TicketParamsSchema, query: ArchiveQuerySchema },
  responses: {
    200: ok('Ticket archivado.', TicketEnvelope),
    400: e400,
    404: errorResponse('Ticket no encontrado.'),
    500: e500,
  },
});

registry.registerPath({
  method: 'post',
  path: '/projects/{projectId}/tickets/{ticketId}/restore',
  tags: ['Tickets'],
  summary: 'Restaurar ticket archivado (P1, H4)',
  description: 'Sin chequeo "solo Administrador" en esta fase.',
  request: { params: TicketParamsSchema },
  responses: {
    200: ok('Ticket restaurado.', TicketEnvelope),
    400: e400,
    404: errorResponse('Ticket no encontrado.'),
    500: e500,
  },
});

registry.registerPath({
  method: 'post',
  path: '/projects/{projectId}/tickets/{ticketId}/responsables',
  tags: ['Responsables'],
  summary: 'Agregar responsable a un ticket (P1, H5)',
  description:
    'Idempotente: asignar al mismo usuario dos veces no es error. Sin regla de auto-asignación en esta fase.',
  request: { params: TicketParamsSchema, body: jsonBody(AddResponsableBodySchema) },
  responses: {
    200: ok('Ticket con `responsables[]` actualizado.', TicketEnvelope),
    400: e400,
    404: errorResponse('Ticket no encontrado.'),
    500: e500,
  },
});

registry.registerPath({
  method: 'get',
  path: '/projects/{projectId}/tickets/{ticketId}/comments',
  tags: ['Comments'],
  summary: 'Listar comentarios de un ticket (P1, H7)',
  description: 'Orden cronológico (más antiguo primero).',
  request: { params: TicketParamsSchema, query: PageQuerySchema },
  responses: {
    200: ok('Página de comentarios.', ComentarioPageEnvelope),
    400: e400,
    404: errorResponse('Ticket no encontrado.'),
    500: e500,
  },
});

registry.registerPath({
  method: 'post',
  path: '/projects/{projectId}/tickets/{ticketId}/comments',
  tags: ['Comments'],
  summary: 'Agregar comentario (P1, H7)',
  description:
    '`contenido` vacío o solo espacios → 400, no se registra. `autorId` es TEMPORAL y sustituye al usuario autenticado.',
  request: { params: TicketParamsSchema, body: jsonBody(CreateComentarioBodySchema) },
  responses: {
    200: ok('Comentario creado.', ComentarioEnvelope),
    400: e400,
    404: errorResponse('Ticket no encontrado.'),
    500: e500,
  },
});

registry.registerPath({
  method: 'get',
  path: '/tickets',
  tags: ['Tickets'],
  summary: 'Buscar tickets con filtros (P1, H8)',
  description:
    'Ruta plana. Filtros opcionales combinables (AND); `etiqueta` y `responsableId` son ids. Excluye archivados. Sin resultados → 200 con `items: []`. Sin acotar por visibilidad en esta fase.',
  request: { query: ListTicketsQuerySchema },
  responses: { 200: ok('Página de tickets.', TicketPageEnvelope), 400: e400, 500: e500 },
});

registry.registerPath({
  method: 'get',
  path: '/reports/closed-tickets',
  tags: ['Reports'],
  summary: 'Conteo de tickets cerrados por mes y proyecto (P2, H9)',
  description:
    'Tickets `TERMINADO` con `cerradoEn`, agrupados por proyecto/mes/año (UTC). Sin filtros = todo el histórico. Sin restricción a Admin en esta fase.',
  request: { query: ClosedTicketsQuerySchema },
  responses: { 200: ok('Conteo tabular.', ReporteEnvelope), 400: e400, 500: e500 },
});

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Mini Jira API',
      version: '0.2.0',
      description:
        'Endpoints P0, P1 y P2 de docs/api-contract.md (los de lock de §6 quedan fuera, por decisión del contrato). Fase sin autenticación: todos los endpoints son anónimos; los campos TEMPORAL sustituyen al usuario autenticado.',
    },
    servers: [{ url: '/api' }],
  });
}
