import { stringify } from 'yaml';
import { buildOpenApiDocument } from '@/lib/openapi/spec';

// GET /api/openapi.yaml — spec generado desde los schemas Zod (misma fuente que los routes).
export function GET() {
  return new Response(stringify(buildOpenApiDocument()), {
    headers: { 'Content-Type': 'application/yaml; charset=utf-8' },
  });
}
