import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stringify } from 'yaml';
import { buildOpenApiDocument } from '../src/lib/openapi/spec';

const out = resolve(__dirname, '..', 'openapi.yaml');
writeFileSync(out, stringify(buildOpenApiDocument()), 'utf-8');
console.log(`openapi.yaml generado en ${out}`);
