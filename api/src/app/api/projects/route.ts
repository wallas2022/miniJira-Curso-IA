import type { NextRequest } from 'next/server';
import { handler, ok, parse, readJson, searchParamsToObject } from '@/lib/api';
import { CreateProjectBodySchema, PageQuerySchema } from '@/lib/schemas';
import { createProject, listProjects } from '@/lib/data';

// POST /api/projects — P1 (H2). creadorId es TEMPORAL (sin auth).
export const POST = handler(async (req: NextRequest) => {
  const body = parse(
    CreateProjectBodySchema,
    await readJson(req),
    'El proyecto no pudo guardarse por errores de validación.',
  );
  return ok(await createProject(body));
});

// GET /api/projects — P0 (H2). Fase sin autenticación: devuelve todos los proyectos.
export const GET = handler(async (req: NextRequest) => {
  const { limit, cursor } = parse(PageQuerySchema, searchParamsToObject(req), 'Parámetros de consulta inválidos.');
  return ok(await listProjects(limit, cursor));
});
