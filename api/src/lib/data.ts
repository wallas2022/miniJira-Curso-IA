import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { notFound, validationError } from '@/lib/api';

// Capa de acceso a datos: único lugar que habla con Supabase. Los errores de
// supabase-js se relanzan tal cual; handler() los loguea y responde genérico.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function must<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

// --- Cursor (keyset sobre creado_en desc, id desc) ---------------------------

function encodeCursor(row: Row) {
  return Buffer.from(JSON.stringify([row.creado_en, row.id])).toString('base64url');
}

function decodeCursor(cursor: string): [string, string] {
  try {
    const v = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    if (
      Array.isArray(v) &&
      typeof v[0] === 'string' &&
      typeof v[1] === 'string' &&
      !Number.isNaN(Date.parse(v[0])) &&
      !/["(),]/.test(v[1])
    ) {
      return [v[0], v[1]];
    }
  } catch {
    /* cae al error de abajo */
  }
  throw validationError('Parámetros de consulta inválidos.', [
    { field: 'cursor', message: 'El cursor no es válido.' },
  ]);
}

function applyCursor<Q extends { or: (f: string) => Q }>(
  q: Q,
  cursor?: string,
  dir: 'desc' | 'asc' = 'desc',
): Q {
  if (!cursor) return q;
  const [t, id] = decodeCursor(cursor);
  const op = dir === 'desc' ? 'lt' : 'gt';
  // Comillas dobles: los timestamps contienen ':' y '+' que PostgREST interpreta.
  return q.or(`creado_en.${op}."${t}",and(creado_en.eq."${t}",id.${op}."${id}")`);
}

function paginate<T extends Row>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? encodeCursor(items[items.length - 1]) : null;
  return { items, nextCursor };
}

// --- Mapeo fila -> forma de types.ts -----------------------------------------

const toUsuarioResumen = (u: Row) => ({
  id: u.id,
  email: u.email,
  nombre: u.nombre,
  rol: u.rol,
  activo: u.activo,
});
const toUsuarioBasico = (u: Row) => ({ id: u.id, nombre: u.nombre, email: u.email });

const toTicket = (t: Row) => ({
  id: t.id,
  titulo: t.titulo,
  descripcion: t.descripcion,
  estado: t.estado,
  prioridad: t.prioridad,
  fecha: t.fecha,
  proyectoId: t.proyecto_id,
  creadorId: t.creador_id,
  creador: toUsuarioBasico(t.creador),
  archivado: t.archivado,
  archivadoPorId: t.archivado_por_id,
  creadoEn: t.creado_en,
  actualizadoEn: t.actualizado_en,
  cerradoEn: t.cerrado_en,
  responsables: (t.responsables as Row[]).map((r) => ({
    userId: r.user_id,
    user: toUsuarioBasico(r.user),
  })),
  etiquetas: (t.etiquetas as Row[]).map((e) => ({ id: e.tag.id, nombre: e.tag.nombre })),
});

const TICKET_SELECT =
  '*, creador:users!tickets_creador_id_fkey(id,nombre,email),' +
  ' responsables:ticket_assignees(user_id, user:users!ticket_assignees_user_id_fkey(id,nombre,email)),' +
  ' etiquetas:ticket_tags(tag:tags(id,nombre))';

// --- Auth (sin sesión: solo verifica credenciales / resuelve usuario) --------

// Hash bcrypt de una contraseña descartable: se compara cuando el email no
// existe para no filtrar por tiempos de respuesta qué cuentas existen.
const DUMMY_HASH = bcrypt.hashSync('no-such-user-placeholder', 10);

export async function verifyCredentials(email: string, password: string) {
  const row = must(
    await supabase.from('users').select('*').ilike('email', email.trim()).maybeSingle(),
  ) as Row | null;
  const valid = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !valid || !row.activo) return null;
  return toUsuarioResumen(row);
}

export async function getUsuario(userId: string) {
  const row = must(
    await supabase.from('users').select('*').eq('id', userId).maybeSingle(),
  ) as Row | null;
  if (!row) throw notFound('Usuario no encontrado.');
  return toUsuarioResumen(row);
}

// --- Projects ----------------------------------------------------------------

export async function listProjects(limit: number, cursor?: string) {
  let q = supabase
    .from('projects')
    .select('*, creador:users!projects_creador_id_fkey(id,nombre,email)')
    .order('creado_en', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  q = applyCursor(q, cursor);
  const { items, nextCursor } = paginate(must(await q) as Row[], limit);

  // ticketsAbiertos es calculado: no archivados y estado != TERMINADO.
  const counts = new Map<string, number>();
  if (items.length > 0) {
    const open = must(
      await supabase
        .from('tickets')
        .select('proyecto_id')
        .in(
          'proyecto_id',
          items.map((p) => p.id),
        )
        .eq('archivado', false)
        .neq('estado', 'TERMINADO'),
    ) as Row[];
    for (const t of open) counts.set(t.proyecto_id, (counts.get(t.proyecto_id) ?? 0) + 1);
  }

  return {
    items: items.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      creadorId: p.creador_id,
      creador: toUsuarioBasico(p.creador),
      creadoEn: p.creado_en,
      ticketsAbiertos: counts.get(p.id) ?? 0,
    })),
    nextCursor,
  };
}

async function assertProjectExists(projectId: string) {
  const row = must(await supabase.from('projects').select('id').eq('id', projectId).maybeSingle());
  if (!row) throw notFound('Proyecto no encontrado.');
}

// --- Tickets -----------------------------------------------------------------

export async function listTickets(projectId: string, limit: number, cursor?: string) {
  await assertProjectExists(projectId);
  let q = supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .eq('proyecto_id', projectId)
    .eq('archivado', false)
    .order('creado_en', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  q = applyCursor(q, cursor);
  const { items, nextCursor } = paginate(must(await q) as Row[], limit);
  return { items: items.map(toTicket), nextCursor };
}

export type TicketPatch = {
  estado?: string;
  titulo?: string;
  descripcion?: string | null;
  prioridad?: string;
  fecha?: string | null;
  etiquetas?: string[];
};

export async function patchTicket(projectId: string, ticketId: string, patch: TicketPatch) {
  const current = must(
    await supabase
      .from('tickets')
      .select('id, estado')
      .eq('id', ticketId)
      .eq('proyecto_id', projectId)
      .maybeSingle(),
  ) as Row | null;
  if (!current) throw notFound('Ticket no encontrado.');

  const { etiquetas, ...fields } = patch;
  const uniqueTags = etiquetas ? [...new Set(etiquetas)] : undefined;

  // Validar etiquetas antes de escribir nada.
  if (uniqueTags && uniqueTags.length > 0) {
    const found = must(await supabase.from('tags').select('id').in('id', uniqueTags)) as Row[];
    const missing = uniqueTags.filter((id) => !found.some((t) => t.id === id));
    if (missing.length > 0) {
      throw validationError('El ticket no pudo actualizarse por errores de validación.', [
        { field: 'etiquetas', message: `Etiquetas inexistentes: ${missing.join(', ')}.` },
      ]);
    }
  }

  const now = new Date().toISOString();
  const update: Row = { ...fields, actualizado_en: now };
  if (fields.estado === 'TERMINADO' && current.estado !== 'TERMINADO') update.cerrado_en = now;
  if (fields.estado && fields.estado !== 'TERMINADO' && current.estado === 'TERMINADO') {
    update.cerrado_en = null;
  }

  must(await supabase.from('tickets').update(update).eq('id', ticketId));

  if (uniqueTags) {
    must(await supabase.from('ticket_tags').delete().eq('ticket_id', ticketId));
    if (uniqueTags.length > 0) {
      must(
        await supabase
          .from('ticket_tags')
          .insert(uniqueTags.map((tag_id) => ({ ticket_id: ticketId, tag_id }))),
      );
    }
  }

  const row = must(
    await supabase.from('tickets').select(TICKET_SELECT).eq('id', ticketId).single(),
  ) as Row;
  return toTicket(row);
}

// =============================================================================
// P1 / P2 — fase sin autenticación: los ids de actor llegan como parámetros
// TEMPORALES (creadorId, autorId, actorId) y se validan contra la tabla users.
// =============================================================================

const newId = (prefix: string) => `${prefix}_${randomUUID()}`;

async function assertUserExists(userId: string, field: string) {
  const row = must(await supabase.from('users').select('id').eq('id', userId).maybeSingle());
  if (!row) {
    throw validationError('La petición contiene referencias inválidas.', [
      { field, message: 'El usuario indicado no existe.' },
    ]);
  }
}

async function assertTagsExist(tagIds: string[]) {
  if (tagIds.length === 0) return;
  const found = must(await supabase.from('tags').select('id').in('id', tagIds)) as Row[];
  const missing = tagIds.filter((id) => !found.some((t) => t.id === id));
  if (missing.length > 0) {
    throw validationError('La petición contiene referencias inválidas.', [
      { field: 'etiquetas', message: `Etiquetas inexistentes: ${missing.join(', ')}.` },
    ]);
  }
}

async function assertTicketInProject(projectId: string, ticketId: string) {
  const row = must(
    await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .eq('proyecto_id', projectId)
      .maybeSingle(),
  );
  if (!row) throw notFound('Ticket no encontrado.');
}

async function fetchTicket(ticketId: string) {
  const row = must(
    await supabase.from('tickets').select(TICKET_SELECT).eq('id', ticketId).single(),
  ) as Row;
  return toTicket(row);
}

// --- Projects (P1) -----------------------------------------------------------

async function fetchProject(projectId: string) {
  const p = must(
    await supabase
      .from('projects')
      .select('*, creador:users!projects_creador_id_fkey(id,nombre,email)')
      .eq('id', projectId)
      .maybeSingle(),
  ) as Row | null;
  if (!p) throw notFound('Proyecto no encontrado.');
  const { count, error } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('proyecto_id', projectId)
    .eq('archivado', false)
    .neq('estado', 'TERMINADO');
  if (error) throw error;
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    creadorId: p.creador_id,
    creador: toUsuarioBasico(p.creador),
    creadoEn: p.creado_en,
    ticketsAbiertos: count ?? 0,
  };
}

export async function createProject(input: {
  nombre: string;
  descripcion?: string | null;
  creadorId: string;
}) {
  await assertUserExists(input.creadorId, 'creadorId');
  const id = newId('proj');
  must(
    await supabase.from('projects').insert({
      id,
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
      creador_id: input.creadorId,
    }),
  );
  return fetchProject(id);
}

export async function patchProject(
  projectId: string,
  patch: { nombre?: string; descripcion?: string | null },
) {
  await assertProjectExists(projectId);
  must(await supabase.from('projects').update(patch).eq('id', projectId));
  return fetchProject(projectId);
}

// --- Tickets (P1) ------------------------------------------------------------

export async function createTicket(
  projectId: string,
  input: {
    titulo: string;
    descripcion?: string | null;
    prioridad?: string;
    fecha?: string | null;
    etiquetas?: string[];
    creadorId: string;
  },
) {
  await assertProjectExists(projectId);
  await assertUserExists(input.creadorId, 'creadorId');
  const tags = input.etiquetas ? [...new Set(input.etiquetas)] : [];
  await assertTagsExist(tags);

  const id = newId('tk');
  must(
    await supabase.from('tickets').insert({
      id,
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
      estado: 'POR_HACER',
      ...(input.prioridad ? { prioridad: input.prioridad } : {}),
      fecha: input.fecha ?? null,
      proyecto_id: projectId,
      creador_id: input.creadorId,
      actualizado_en: new Date().toISOString(),
    }),
  );
  if (tags.length > 0) {
    must(
      await supabase.from('ticket_tags').insert(tags.map((tag_id) => ({ ticket_id: id, tag_id }))),
    );
  }
  return fetchTicket(id);
}

/** Archivado lógico: nunca borra la fila. */
export async function archiveTicket(projectId: string, ticketId: string, actorId?: string) {
  await assertTicketInProject(projectId, ticketId);
  if (actorId) await assertUserExists(actorId, 'actorId');
  must(
    await supabase
      .from('tickets')
      .update({
        archivado: true,
        archivado_por_id: actorId ?? null,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', ticketId),
  );
  return fetchTicket(ticketId);
}

export async function restoreTicket(projectId: string, ticketId: string) {
  await assertTicketInProject(projectId, ticketId);
  must(
    await supabase
      .from('tickets')
      .update({ archivado: false, archivado_por_id: null, actualizado_en: new Date().toISOString() })
      .eq('id', ticketId),
  );
  return fetchTicket(ticketId);
}

export async function addResponsable(projectId: string, ticketId: string, userId: string) {
  await assertTicketInProject(projectId, ticketId);
  await assertUserExists(userId, 'userId');
  // Idempotente: asignar dos veces al mismo usuario no es error.
  must(
    await supabase
      .from('ticket_assignees')
      .upsert(
        { ticket_id: ticketId, user_id: userId },
        { onConflict: 'ticket_id,user_id', ignoreDuplicates: true },
      ),
  );
  return fetchTicket(ticketId);
}

export type TicketFilters = {
  proyectoId?: string;
  prioridad?: string;
  responsableId?: string;
  etiqueta?: string;
  fechaDesde?: string;
  fechaHasta?: string;
};

export async function listAllTickets(filters: TicketFilters, limit: number, cursor?: string) {
  // Filtros por relación: se resuelven a conjuntos de ids y se intersectan (AND).
  let idSet: string[] | null = null;
  if (filters.responsableId) {
    const rows = must(
      await supabase.from('ticket_assignees').select('ticket_id').eq('user_id', filters.responsableId),
    ) as Row[];
    idSet = rows.map((r) => r.ticket_id);
  }
  if (filters.etiqueta) {
    const rows = must(
      await supabase.from('ticket_tags').select('ticket_id').eq('tag_id', filters.etiqueta),
    ) as Row[];
    const ids = rows.map((r) => r.ticket_id);
    idSet = idSet ? idSet.filter((id) => ids.includes(id)) : ids;
  }
  // Sin resultados no es un error: 200 con items [].
  if (idSet && idSet.length === 0) return { items: [], nextCursor: null };

  let q = supabase.from('tickets').select(TICKET_SELECT).eq('archivado', false);
  if (idSet) q = q.in('id', idSet);
  if (filters.proyectoId) q = q.eq('proyecto_id', filters.proyectoId);
  if (filters.prioridad) q = q.eq('prioridad', filters.prioridad);
  if (filters.fechaDesde) q = q.gte('fecha', filters.fechaDesde);
  if (filters.fechaHasta) q = q.lte('fecha', filters.fechaHasta);
  q = q
    .order('creado_en', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  q = applyCursor(q, cursor);
  const { items, nextCursor } = paginate(must(await q) as Row[], limit);
  return { items: items.map(toTicket), nextCursor };
}

// --- Comments (P1) -----------------------------------------------------------

const toComentario = (c: Row) => ({
  id: c.id,
  ticketId: c.ticket_id,
  autorId: c.autor_id,
  autor: toUsuarioBasico(c.autor),
  contenido: c.contenido,
  creadoEn: c.creado_en,
});

const COMMENT_SELECT = '*, autor:users!comments_autor_id_fkey(id,nombre,email)';

export async function listComments(
  projectId: string,
  ticketId: string,
  limit: number,
  cursor?: string,
) {
  await assertTicketInProject(projectId, ticketId);
  let q = supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('ticket_id', ticketId)
    .order('creado_en', { ascending: true }) // orden cronológico
    .order('id', { ascending: true })
    .limit(limit + 1);
  q = applyCursor(q, cursor, 'asc');
  const { items, nextCursor } = paginate(must(await q) as Row[], limit);
  return { items: items.map(toComentario), nextCursor };
}

export async function createComment(
  projectId: string,
  ticketId: string,
  input: { contenido: string; autorId: string },
) {
  await assertTicketInProject(projectId, ticketId);
  await assertUserExists(input.autorId, 'autorId');
  const id = newId('cmt');
  must(
    await supabase
      .from('comments')
      .insert({ id, ticket_id: ticketId, autor_id: input.autorId, contenido: input.contenido }),
  );
  const row = must(
    await supabase.from('comments').select(COMMENT_SELECT).eq('id', id).single(),
  ) as Row;
  return toComentario(row);
}

// --- Reports (P2) ------------------------------------------------------------

export async function closedTicketsReport(filters: {
  mes?: number;
  anio?: number;
  proyectoId?: string;
}) {
  let q = supabase
    .from('tickets')
    .select('proyecto_id, cerrado_en, proyecto:projects(id,nombre)')
    .eq('estado', 'TERMINADO')
    .not('cerrado_en', 'is', null);
  if (filters.proyectoId) q = q.eq('proyecto_id', filters.proyectoId);
  const rows = must(await q) as Row[];

  // Agrupa por proyecto + mes + año (UTC).
  const groups = new Map<
    string,
    { proyectoId: string; proyecto: string; mes: number; anio: number; cantidad: number }
  >();
  for (const r of rows) {
    const d = new Date(r.cerrado_en);
    const mes = d.getUTCMonth() + 1;
    const anio = d.getUTCFullYear();
    if (filters.mes && filters.mes !== mes) continue;
    if (filters.anio && filters.anio !== anio) continue;
    const key = `${r.proyecto_id}|${anio}|${mes}`;
    const g = groups.get(key);
    if (g) g.cantidad += 1;
    else groups.set(key, { proyectoId: r.proyecto_id, proyecto: r.proyecto.nombre, mes, anio, cantidad: 1 });
  }
  return [...groups.values()].sort(
    (a, b) => b.anio - a.anio || b.mes - a.mes || a.proyecto.localeCompare(b.proyecto),
  );
}
