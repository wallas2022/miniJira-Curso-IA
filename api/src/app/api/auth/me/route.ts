import type { NextRequest } from 'next/server';
import { handler, ok, parse, searchParamsToObject } from '@/lib/api';
import { MeQuerySchema } from '@/lib/schemas';
import { getUsuario } from '@/lib/data';

// GET /api/auth/me — P0 (H1). Fase sin autenticación: el usuario llega por ?userId=, no por token.
export const GET = handler(async (req: NextRequest) => {
  const { userId } = parse(MeQuerySchema, searchParamsToObject(req), 'Parámetros de consulta inválidos.');
  return ok(await getUsuario(userId));
});
