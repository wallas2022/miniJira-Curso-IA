import type { NextRequest } from 'next/server';
import { handler, ok, parse } from '@/lib/api';
import { TicketParamsSchema } from '@/lib/schemas';
import { restoreTicket } from '@/lib/data';

type Ctx = { params: Promise<{ projectId: string; ticketId: string }> };

// POST /api/projects/:projectId/tickets/:ticketId/restore — P1 (H4). Sin chequeo "solo Admin" en esta fase.
export const POST = handler(async (_req: NextRequest, ctx: Ctx) => {
  const { projectId, ticketId } = parse(TicketParamsSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  return ok(await restoreTicket(projectId, ticketId));
});
