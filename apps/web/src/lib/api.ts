import type { Comentario, Estado, Prioridad, Proyecto, Ticket, UsuarioResumen } from '../types';

// Cliente tipado de los endpoints P0 (§2) y P1 (§3) de docs/api-contract.md.

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

export interface CreateProjectPayload {
  nombre: string;
  descripcion?: string | null;
}

export interface PatchProjectPayload {
  nombre?: string;
  descripcion?: string | null;
}

export interface CreateTicketPayload {
  titulo: string;
  descripcion?: string | null;
  prioridad?: Prioridad;
  fecha?: string | null; // YYYY-MM-DD
  etiquetas?: string[]; // IDs de etiquetas
}

export interface AllTicketsFilters extends PageParams {
  proyectoId?: string;
  prioridad?: Prioridad;
  responsableId?: string;
  etiqueta?: string;
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD
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

// Serializa solo los valores definidos; sirve para paginación y filtros.
function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// Fase sin auth: la API pide el usuario en el body (creadorId/autorId) o en el query (actorId).
// Sin valor por defecto: si falta VITE_DEV_USER_ID, falla de forma explícita.
function devUserId(): string {
  const id = import.meta.env.VITE_DEV_USER_ID;
  if (!id) throw new Error('Falta VITE_DEV_USER_ID en el entorno (ver apps/web/.env.example).');
  return id;
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
  return request<Page<Proyecto>>(`/projects${query({ ...params })}`);
}

export function listProjectTickets(
  projectId: string,
  params: PageParams = {},
): Promise<Page<Ticket>> {
  return request<Page<Ticket>>(`/projects/${encodeURIComponent(projectId)}/tickets${query({ ...params })}`);
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

// --- P1 ---------------------------------------------------------------------

export function createProject(payload: CreateProjectPayload): Promise<Proyecto> {
  return request<Proyecto>('/projects', {
    method: 'POST',
    body: { ...payload, creadorId: devUserId() },
  });
}

export function patchProject(projectId: string, patch: PatchProjectPayload): Promise<Proyecto> {
  return request<Proyecto>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export function createTicket(projectId: string, payload: CreateTicketPayload): Promise<Ticket> {
  return request<Ticket>(`/projects/${encodeURIComponent(projectId)}/tickets`, {
    method: 'POST',
    body: { ...payload, creadorId: devUserId() },
  });
}

// Archivado lógico (nunca borrado físico); actorId queda como archivadoPorId.
export function archiveTicket(projectId: string, ticketId: string): Promise<Ticket> {
  return request<Ticket>(
    `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}${query({ actorId: devUserId() })}`,
    { method: 'DELETE' },
  );
}

export function restoreTicket(projectId: string, ticketId: string): Promise<Ticket> {
  return request<Ticket>(
    `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/restore`,
    { method: 'POST' },
  );
}

export function addResponsable(
  projectId: string,
  ticketId: string,
  userId: string,
): Promise<Ticket> {
  return request<Ticket>(
    `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/responsables`,
    { method: 'POST', body: { userId } },
  );
}

export function listComments(
  projectId: string,
  ticketId: string,
  params: PageParams = {},
): Promise<Page<Comentario>> {
  return request<Page<Comentario>>(
    `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/comments${query({ ...params })}`,
  );
}

export function createComment(
  projectId: string,
  ticketId: string,
  contenido: string,
): Promise<Comentario> {
  return request<Comentario>(
    `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/comments`,
    { method: 'POST', body: { contenido, autorId: devUserId() } },
  );
}

// Ruta plana GET /tickets (única excepción de ruteo del contrato): filtros combinables (AND).
export function listAllTickets(filters: AllTicketsFilters = {}): Promise<Page<Ticket>> {
  return request<Page<Ticket>>(`/tickets${query({ ...filters })}`);
}
