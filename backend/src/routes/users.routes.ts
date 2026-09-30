import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';

const router = Router();
router.use(requireAuth);

// Listado minimo (id + email) para el selector de responsables de un ticket (RF-05).
// No expone gestion de cuentas (crear/desactivar) en este prototipo.
router.get('/', async (_req, res) => {
  const usuarios = await prisma.user.findMany({
    where: { activo: true },
    select: { id: true, email: true, rol: true },
    orderBy: { email: 'asc' },
  });
  res.json(usuarios);
});

export default router;
