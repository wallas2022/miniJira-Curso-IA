import { Router } from 'express';

const router = Router();

// RF-13 (Cerrado): vista simple (tabla, sin graficos) de tickets cerrados por mes y proyecto.
// Sustituye al dashboard con graficos, que quedo en Fase 2. Solo Administrador.
router.get('/tickets-cerrados', (_req, res) => {
  res.status(501).json({ error: 'No implementado: reporte de tickets cerrados pendiente (ver docs/specs.md, RF-13).' });
});

export default router;
