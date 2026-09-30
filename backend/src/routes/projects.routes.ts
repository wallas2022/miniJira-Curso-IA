import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';

const router = Router();
router.use(requireAuth);

// RF-17: Admin ve todos los proyectos; Usuario ve solo los que creo
// o aquellos donde tiene al menos un ticket asignado como responsable.
function visibilityWhere(user: { id: string; rol: string }) {
  if (user.rol === 'ADMIN') return {};
  return {
    OR: [
      { creadorId: user.id },
      { tickets: { some: { responsables: { some: { userId: user.id } } } } },
    ],
  };
}

// RF-04
router.get('/', async (req, res) => {
  const proyectos = await prisma.project.findMany({
    where: visibilityWhere(req.user!),
    include: { _count: { select: { tickets: { where: { archivado: false } } } } },
    orderBy: { creadoEn: 'desc' },
  });
  res.json(proyectos);
});

// RF-04: Admin y Usuario pueden crear proyectos.
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body ?? {};
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio.' });
  }
  const proyecto = await prisma.project.create({
    data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null, creadorId: req.user!.id },
  });
  res.status(201).json(proyecto);
});

router.get('/:id', async (req, res) => {
  const proyecto = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const visible =
    req.user!.rol === 'ADMIN' ||
    proyecto.creadorId === req.user!.id ||
    (await prisma.ticket.count({
      where: { proyectoId: proyecto.id, responsables: { some: { userId: req.user!.id } } },
    })) > 0;
  if (!visible) return res.status(403).json({ error: 'No tenes acceso a este proyecto.' });

  res.json(proyecto);
});

// RF-04: Usuario solo edita los proyectos que el mismo creo; Admin, cualquiera.
router.put('/:id', async (req, res) => {
  const proyecto = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado.' });
  if (req.user!.rol !== 'ADMIN' && proyecto.creadorId !== req.user!.id) {
    return res.status(403).json({ error: 'Solo el creador o un Administrador pueden editar este proyecto.' });
  }

  const { nombre, descripcion } = req.body ?? {};
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio.' });
  }

  const actualizado = await prisma.project.update({
    where: { id: proyecto.id },
    data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null },
  });
  res.json(actualizado);
});

export default router;
