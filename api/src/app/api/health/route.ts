import { connection } from 'next/server';
import { handler, ok } from '@/lib/api';

// GET /api/health — healthcheck del contenedor. Sin dependencias externas (no toca Supabase).
export const GET = handler(async () => {
  // Con cacheComponents, `new Date()` solo se permite tras un acceso dinámico: así no se prerenderiza.
  await connection();
  return ok({ status: 'ok', timestamp: new Date().toISOString() });
});
