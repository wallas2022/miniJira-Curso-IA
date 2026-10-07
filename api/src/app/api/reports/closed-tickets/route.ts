import type { NextRequest } from 'next/server';
import { handler, ok, parse, searchParamsToObject } from '@/lib/api';
import { ClosedTicketsQuerySchema } from '@/lib/schemas';
import { closedTicketsReport } from '@/lib/data';

// GET /api/reports/closed-tickets — P2 (H9). Sin restricción a Admin en esta fase.
export const GET = handler(async (req: NextRequest) => {
  const filters = parse(ClosedTicketsQuerySchema, searchParamsToObject(req), 'Parámetros de consulta inválidos.');
  return ok(await closedTicketsReport(filters));
});
