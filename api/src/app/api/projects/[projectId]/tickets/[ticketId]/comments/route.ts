import type { NextRequest } from 'next/server';
import { handler, ok, parse, readJson, searchParamsToObject } from '@/lib/api';
import { CreateComentarioBodySchema, PageQuerySchema, TicketParamsSchema } from '@/lib/schemas';
import { createComment, listComments } from '@/lib/data';

type Ctx = { params: Promise<{ projectId: string; ticketId: string }> };

// GET /api/projects/:projectId/tickets/:ticketId/comments — P1 (H7). Orden cronológico.
export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId, ticketId } = parse(TicketParamsSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const { limit, cursor } = parse(PageQuerySchema, searchParamsToObject(req), 'Parámetros de consulta inválidos.');
  return ok(await listComments(projectId, ticketId, limit, cursor));
});

// POST /api/projects/:projectId/tickets/:ticketId/comments — P1 (H7). autorId es TEMPORAL (sin auth).
export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId, ticketId } = parse(TicketParamsSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const body = parse(
    CreateComentarioBodySchema,
    await readJson(req),
    'El comentario no pudo guardarse por errores de validación.',
  );
  return ok(await createComment(projectId, ticketId, body));
});
