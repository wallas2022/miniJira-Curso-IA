import type { NextRequest } from 'next/server';
import { handler, ok, parse, readJson, unauthorized } from '@/lib/api';
import { LoginBodySchema } from '@/lib/schemas';
import { verifyCredentials } from '@/lib/data';

// POST /api/auth/login — P0 (H1). Fase sin autenticación: el token es un marcador, no un JWT.
export const POST = handler(async (req: NextRequest) => {
  const body = parse(LoginBodySchema, await readJson(req), 'No se pudo iniciar sesión por errores de validación.');
  const user = await verifyCredentials(body.email, body.password);
  // Mensaje genérico: no indica cuál de los dos campos falló (H1, edge case).
  if (!user) throw unauthorized('Credenciales incorrectas.');
  return ok({ token: 'anonymous-dev-token', user });
});
