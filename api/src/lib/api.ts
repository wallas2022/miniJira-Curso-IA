import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

type FieldError = { field: string; message: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly kind: 'validation' | 'unauthorized' | 'not-found' | 'internal',
    readonly title: string,
    readonly detail: string,
    readonly errors?: FieldError[],
  ) {
    super(detail);
  }
}

export const validationError = (detail: string, errors: FieldError[]) =>
  new ApiError(400, 'validation', 'Validation Failed', detail, errors);
export const notFound = (detail: string) => new ApiError(404, 'not-found', 'Not Found', detail);
export const unauthorized = (detail: string) =>
  new ApiError(401, 'unauthorized', 'Unauthorized', detail);

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, error: null }, init);
}

function fail(err: ApiError, instance: string) {
  return NextResponse.json(
    {
      data: null,
      error: {
        type: `https://minijira.dev/errors/${err.kind}`,
        title: err.title,
        status: err.status,
        detail: err.detail,
        instance,
        ...(err.errors ? { errors: err.errors } : {}),
      },
    },
    { status: err.status },
  );
}

/** Valida con Zod ANTES de tocar la BD; lanza 400 con errors[] por campo. */
export function parse<S extends z.ZodType>(schema: S, input: unknown, detail: string): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw validationError(
    detail,
    result.error.issues.map((i) => ({
      field: i.path.join('.') || '(body)',
      message: i.message,
    })),
  );
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw validationError('El cuerpo de la petición no es JSON válido.', [
      { field: '(body)', message: 'JSON inválido.' },
    ]);
  }
}

/**
 * Envuelve un handler: errores conocidos -> Problem Details; cualquier otro
 * error se loguea internamente y el cliente solo recibe un mensaje genérico.
 */
export function handler<Ctx = unknown>(
  fn: (req: NextRequest, ctx: Ctx) => Promise<Response>,
): (req: NextRequest, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    const instance = new URL(req.url).pathname;
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return fail(e, instance);
      console.error(`[api] ${req.method} ${instance} falló:`, e);
      return fail(
        new ApiError(
          500,
          'internal',
          'Internal Server Error',
          'Ocurrió un error interno. Inténtalo de nuevo más tarde.',
        ),
        instance,
      );
    }
  };
}

export const searchParamsToObject = (req: NextRequest) =>
  Object.fromEntries(req.nextUrl.searchParams.entries());
