import type { NextRequest } from 'next/server';
import { handler, ok, parse, searchParamsToObject } from '@/lib/api';
import { ListTicketsQuerySchema } from '@/lib/schemas';
import { listAllTickets } from '@/lib/data';

// GET /api/tickets — P1 (H8). Ruta plana; filtros opcionales combinables (AND). Sin acotar por visibilidad en esta fase.
export const GET = handler(async (req: NextRequest) => {
  const { limit, cursor, ...filters } = parse(
    ListTicketsQuerySchema,
    searchParamsToObject(req),
    'Parámetros de consulta inválidos.',
  );
  return ok(await listAllTickets(filters, limit, cursor));
});
