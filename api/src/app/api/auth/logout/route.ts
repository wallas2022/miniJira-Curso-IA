import { handler, ok } from '@/lib/api';

// POST /api/auth/logout — P2 (H1). Sin sesiones en esta fase no hay token que invalidar: responde ok.
export const POST = handler(async () => ok({ ok: true }));
