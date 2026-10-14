import type { Estado, Prioridad, Proyecto, Ticket, UsuarioResumen } from '../types';

// Cliente tipado de los endpoints P0 de docs/api-contract.md §2.

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: { field: string; message: string }[];
}

interface ApiResponse<T> {
  data: T | null;
  error: ProblemDetails | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageParams {
  cursor?: string;
  limit?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: UsuarioResumen;
}

export interface TicketPatch {
  estado?: Estado;
  titulo?: string;
  descripcion?: string | null;
  prioridad?: Prioridad;
  fecha?: string | null;
  etiquetas?: string[];
}

export class ApiError extends Error {
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = 'ApiError';
    this.problem = problem;
  }

  get status(): number {
    return this.problem.status;
  }
}

function baseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url) throw new Error('Falta VITE_API_URL en el entorno (ver apps/web/.env.example).');
  return url.replace(/\/+$/, '');
}

function query(params: PageParams): string {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = init;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = import.meta.env.VITE_API_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl()}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let envelope: ApiResponse<T> | null = null;
  try {
    envelope = (await res.json()) as ApiResponse<T>;
  } catch {
    // Cuerpo no JSON: se resuelve abajo como error genérico.
  }

  if (!res.ok || !envelope || envelope.error || envelope.data === null) {
    throw new ApiError(
      envelope?.error ?? {
        type: 'about:blank',
        title: res.statusText || 'Request Failed',
        status: res.status,
        detail: `La API respondió ${res.status} sin un cuerpo válido.`,
        instance: path,
      },
    );
  }
  return envelope.data;
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return request<LoginResult>('/auth/login', { method: 'POST', body: payload, auth: false });
}

export function getMe(): Promise<UsuarioResumen> {
  return request<UsuarioResumen>('/auth/me');
}

export function listProjects(params: PageParams = {}): Promise<Page<Proyecto>> {
  return request<Page<Proyecto>>(`/projects${query(params)}`);
}

export function listProjectTickets(
  projectId: string,
  params: PageParams = {},
): Promise<Page<Ticket>> {
  return request<Page<Ticket>>(`/projects/${encodeURIComponent(projectId)}/tickets${query(params)}`);
}

export function patchTicket(
  projectId: string,
  ticketId: string,
  patch: TicketPatch,
): Promise<Ticket> {
  return request<Ticket>(
    `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
    { method: 'PATCH', body: patch },
  );
}
