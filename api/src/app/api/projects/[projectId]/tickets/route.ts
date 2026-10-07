import type { NextRequest } from 'next/server';
import { handler, ok, parse, readJson, searchParamsToObject } from '@/lib/api';
import { CreateTicketBodySchema, PageQuerySchema, ProjectIdParamSchema } from '@/lib/schemas';
import { createTicket, listTickets } from '@/lib/data';

type Ctx = { params: Promise<{ projectId: string }> };

// POST /api/projects/:projectId/tickets — P1 (H3). Estado inicial POR_HACER; creadorId es TEMPORAL (sin auth).
export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId } = parse(ProjectIdParamSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const body = parse(
    CreateTicketBodySchema,
    await readJson(req),
    'El ticket no pudo guardarse por errores de validación.',
  );
  return ok(await createTicket(projectId, body));
});

// GET /api/projects/:projectId/tickets — P0 (H6). Excluye archivados.
export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId } = parse(ProjectIdParamSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const { limit, cursor } = parse(PageQuerySchema, searchParamsToObject(req), 'Parámetros de consulta inválidos.');
  return ok(await listTickets(projectId, limit, cursor));
});
