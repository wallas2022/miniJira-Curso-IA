import type { NextRequest } from 'next/server';
import { handler, ok, parse, readJson } from '@/lib/api';
import { PatchProjectBodySchema, ProjectIdParamSchema } from '@/lib/schemas';
import { patchProject } from '@/lib/data';

type Ctx = { params: Promise<{ projectId: string }> };

// PATCH /api/projects/:projectId — P1 (H2). Sin chequeo de "solo el creador" en esta fase.
export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const { projectId } = parse(ProjectIdParamSchema, await ctx.params, 'Parámetros de ruta inválidos.');
  const body = parse(
    PatchProjectBodySchema,
    await readJson(req),
    'El proyecto no pudo actualizarse por errores de validación.',
  );
  return ok(await patchProject(projectId, body));
});
