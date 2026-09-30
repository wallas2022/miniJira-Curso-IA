import type { AuthUser, Estado, Prioridad, Proyecto, Ticket, UsuarioResumen } from '../types';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  try {
    return localStorage.getItem('mj_token');
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Error inesperado (${res.status}).`);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  listUsers: () => request<UsuarioResumen[]>('/api/users'),

  listProjects: () => request<Proyecto[]>('/api/projects'),
  getProject: (id: string) => request<Proyecto>(`/api/projects/${id}`),
  createProject: (data: { nombre: string; descripcion?: string }) =>
    request<Proyecto>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),

  listTickets: (proyectoId: string) => request<Ticket[]>(`/api/tickets?proyectoId=${proyectoId}`),
  createTicket: (data: { proyectoId: string; titulo: string; descripcion?: string; prioridad?: Prioridad }) =>
    request<Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id: string, data: { titulo?: string; descripcion?: string; prioridad?: Prioridad }) =>
    request<Ticket>(`/api/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  moveTicket: (id: string, estado: Estado) =>
    request<Ticket>(`/api/tickets/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  assignTicket: (id: string, userIds: string[]) =>
    request<Ticket>(`/api/tickets/${id}/responsables`, { method: 'PATCH', body: JSON.stringify({ userIds }) }),
  archiveTicket: (id: string) => request<Ticket>(`/api/tickets/${id}`, { method: 'DELETE' }),
};
