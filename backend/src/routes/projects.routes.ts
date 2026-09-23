import { Router } from 'express';

const router = Router();

// RF-04 (Cerrado): todos los usuarios ven todos los proyectos.
router.get('/', (_req, res) => {
  res.status(501).json({ error: 'No implementado: listado de Proyectos pendiente (ver docs/specs.md, RF-04).' });
});

// RF-04 (Cerrado): solo el Administrador crea proyectos. Validacion de rol pendiente de implementar.
router.post('/', (_req, res) => {
  res.status(501).json({ error: 'No implementado: creacion de Proyecto pendiente (ver docs/specs.md, RF-04).' });
});

export default router;
