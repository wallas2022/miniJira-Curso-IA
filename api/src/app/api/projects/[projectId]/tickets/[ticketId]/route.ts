import type { NextRequest } from 'next/server';
import { handler, ok, parse, readJson, searchParamsToObject } from '@/lib/api';
import { ArchiveQuerySchema, PatchTicketBodySchema, TicketParamsSchema } from '@/lib/schemas';
import { archiveTicket, patchTicket } from '@/lib/data';

type Ctx = { params: Promise<{ projectId: string; ticketId: string }> };

// DELETE /api/projects/:projectId/tickets/:ticketId — P1 (H4). Archivado lógico, nunca borrado físico.
// actorId (query) es TEMPORAL (sin auth) y se guarda como archivadoPorId.
export const DELETE = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId, ticketId } = parse(TicketParamsSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const { actorId } = parse(ArchiveQuerySchema, searchParamsToObject(req), 'Parámetros de consulta inválidos.');
  return ok(await archiveTicket(projectId, ticketId, actorId));
});

// PATCH /api/projects/:projectId/tickets/:ticketId — P0 (H3/H6). Last-write-wins; sin permisos en esta fase.
export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId, ticketId } = parse(TicketParamsSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const body = parse(
    PatchTicketBodySchema,
    await readJson(req),
    'El ticket no pudo actualizarse por errores de validación.',
  );
  return ok(await patchTicket(projectId, ticketId, body));
});
