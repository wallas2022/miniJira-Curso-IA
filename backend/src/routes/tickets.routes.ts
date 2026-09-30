import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';

const router = Router();
router.use(requireAuth);

const ESTADOS = ['POR_HACER', 'EN_PROGRESO', 'REVIEW', 'TERMINADO'] as const;
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'] as const;

const ticketInclude = {
  responsables: { include: { user: { select: { id: true, email: true } } } },
  creador: { select: { id: true, email: true } },
};

async function proyectoVisible(proyectoId: string, user: { id: string; rol: string }) {
  const proyecto = await prisma.project.findUnique({ where: { id: proyectoId } });
  if (!proyecto) return null;
  if (user.rol === 'ADMIN' || proyecto.creadorId === user.id) return proyecto;
  const asignado = await prisma.ticket.count({
    where: { proyectoId, responsables: { some: { userId: user.id } } },
  });
  return asignado > 0 ? proyecto : null;
}

async function cargarTicketEditable(id: string, user: { id: string; rol: string }) {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket) return { ticket: null, autorizado: false };
  const esResponsable = ticket.responsables.some((r) => r.userId === user.id);
  const autorizado = user.rol === 'ADMIN' || ticket.creadorId === user.id || esResponsable;
  return { ticket, autorizado };
}

// RF-08/RF-09 (version minima de este prototipo: filtro por proyecto; fecha/prioridad/
// responsable/etiquetas quedan para una iteracion siguiente).
router.get('/', async (req, res) => {
  const proyectoId = String(req.query.proyectoId ?? '');
  if (!proyectoId) return res.status(400).json({ error: 'Falta proyectoId.' });

  const proyecto = await proyectoVisible(proyectoId, req.user!);
  if (!proyecto) return res.status(403).json({ error: 'No tenes acceso a este proyecto.' });

  const tickets = await prisma.ticket.findMany({
    where: { proyectoId, archivado: false },
    include: ticketInclude,
    orderBy: { creadoEn: 'asc' },
  });
  res.json(tickets);
});

// RF-01/RF-03/RF-08: titulo obligatorio, un unico proyecto, campos por defecto.
router.post('/', async (req, res) => {
  const { proyectoId, titulo, descripcion, prioridad } = req.body ?? {};
  if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
    return res.status(400).json({ error: 'El titulo es obligatorio.' });
  }
  if (!proyectoId) return res.status(400).json({ error: 'Falta proyectoId.' });
  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    return res.status(400).json({ error: `Prioridad invalida. Valores: ${PRIORIDADES.join(', ')}.` });
  }

  const proyecto = await proyectoVisible(proyectoId, req.user!);
  if (!proyecto) return res.status(403).json({ error: 'No tenes acceso a este proyecto.' });

  const ticket = await prisma.ticket.create({
    data: {
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      prioridad: prioridad ?? 'MEDIA',
      proyectoId,
      creadorId: req.user!.id,
    },
    include: ticketInclude,
  });
  res.status(201).json(ticket);
});

// RF-08: edicion de campos basicos. Usuario solo en tickets propios o asignados; Admin, cualquiera.
router.patch('/:id', async (req, res) => {
  const { ticket, autorizado } = await cargarTicketEditable(req.params.id, req.user!);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' });
  if (!autorizado) return res.status(403).json({ error: 'No tenes permiso para editar este ticket.' });

  const { titulo, descripcion, prioridad } = req.body ?? {};
  if (titulo !== undefined && (!titulo || !String(titulo).trim())) {
    return res.status(400).json({ error: 'El titulo es obligatorio.' });
  }
  if (prioridad !== undefined && !PRIORIDADES.includes(prioridad)) {
    return res.status(400).json({ error: `Prioridad invalida. Valores: ${PRIORIDADES.join(', ')}.` });
  }

  const actualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      ...(titulo !== undefined && { titulo: String(titulo).trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
      ...(prioridad !== undefined && { prioridad }),
    },
    include: ticketInclude,
  });
  res.json(actualizado);
});

// RF-10: mover entre los 4 estados fijos. Usuario solo en tickets propios o asignados.
router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body ?? {};
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `Estado invalido. Valores: ${ESTADOS.join(', ')}.` });
  }

  const { ticket, autorizado } = await cargarTicketEditable(req.params.id, req.user!);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' });
  if (!autorizado) return res.status(403).json({ error: 'No tenes permiso para mover este ticket.' });

  const actualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      estado,
      cerradoEn: estado === 'TERMINADO' ? new Date() : null,
    },
    include: ticketInclude,
  });
  res.json(actualizado);
});

// RF-05: asignar/reasignar responsables. Regla pendiente de confirmar con el PO/PM (R-06):
// hasta entonces, un Usuario solo puede autoasignarse/autodesasignarse; el Admin asigna a cualquiera.
router.patch('/:id/responsables', async (req, res) => {
  const { userIds } = req.body ?? {};
  if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== 'string')) {
    return res.status(400).json({ error: 'userIds debe ser un arreglo de ids.' });
  }

  const { ticket, autorizado } = await cargarTicketEditable(req.params.id, req.user!);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' });
  if (!autorizado) return res.status(403).json({ error: 'No tenes permiso sobre este ticket.' });

  if (req.user!.rol !== 'ADMIN') {
    const actuales = new Set(ticket.responsables.map((r) => r.userId));
    const nuevos = new Set(userIds);
    actuales.delete(req.user!.id);
    nuevos.delete(req.user!.id);
    const cambiaTerceros = actuales.size !== nuevos.size || [...actuales].some((id) => !nuevos.has(id));
    if (cambiaTerceros) {
      return res.status(403).json({ error: 'Un Usuario solo puede asignarse o desasignarse a si mismo.' });
    }
  }

  await prisma.ticketAssignee.deleteMany({ where: { ticketId: ticket.id } });
  if (userIds.length > 0) {
    await prisma.ticketAssignee.createMany({
      data: userIds.map((userId: string) => ({ ticketId: ticket.id, userId })),
      skipDuplicates: true,
    });
  }

  const actualizado = await prisma.ticket.findUnique({ where: { id: ticket.id }, include: ticketInclude });
  res.json(actualizado);
});

// RF-01/RF-02: "eliminar" = archivo logico. Usuario solo sus propios tickets;
// Admin cualquiera, dejando traza de quien archivo si no es el creador.
router.delete('/:id', async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' });

  const esCreador = ticket.creadorId === req.user!.id;
  if (req.user!.rol !== 'ADMIN' && !esCreador) {
    return res.status(403).json({ error: 'Un Usuario solo puede archivar sus propios tickets.' });
  }

  const actualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { archivado: true, archivadoPorId: esCreador ? null : req.user!.id },
  });
  res.json(actualizado);
});

// RF-02: solo el Administrador puede restaurar tickets archivados.
router.patch('/:id/restaurar', async (req, res) => {
  if (req.user!.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo un Administrador puede restaurar tickets.' });
  }
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' });

  const actualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { archivado: false, archivadoPorId: null },
  });
  res.json(actualizado);
});

// RF-11: comentarios dentro de un ticket. Pendiente para una proxima iteracion del prototipo.
router.post('/:id/comentarios', (_req, res) => {
  res.status(501).json({ error: 'No implementado en este prototipo: comentarios (ver docs/specs.md, RF-11).' });
});

export default router;
