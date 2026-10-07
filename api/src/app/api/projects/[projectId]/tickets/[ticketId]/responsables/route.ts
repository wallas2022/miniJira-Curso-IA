import type { NextRequest } from 'next/server';
import { handler, ok, parse, readJson } from '@/lib/api';
import { AddResponsableBodySchema, TicketParamsSchema } from '@/lib/schemas';
import { addResponsable } from '@/lib/data';

type Ctx = { params: Promise<{ projectId: string; ticketId: string }> };

// POST /api/projects/:projectId/tickets/:ticketId/responsables — P1 (H5). Sin regla de auto-asignación en esta fase.
export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId, ticketId } = parse(TicketParamsSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const { userId } = parse(
    AddResponsableBodySchema,
    await readJson(req),
    'No se pudo asignar el responsable por errores de validación.',
  );
  return ok(await addResponsable(projectId, ticketId, userId));
});
