import { Router } from 'express';

const router = Router();

// RF-08/RF-09 (Cerrado): listado con filtros por fecha, prioridad, responsable, proyecto y etiquetas.
router.get('/', (_req, res) => {
  res.status(501).json({ error: 'No implementado: listado/filtrado de Tickets pendiente (ver docs/specs.md, RF-08/RF-09).' });
});

// RF-01/RF-03/RF-08 (Cerrado): titulo obligatorio, uno o mas proyectos, campos por defecto (estado, prioridad).
router.post('/', (_req, res) => {
  res.status(501).json({ error: 'No implementado: creacion de Ticket pendiente (ver docs/specs.md, RF-01/RF-03/RF-08).' });
});

// RF-16 (Cerrado): bloqueo optimista por campo `version`; responder 409 si no coincide.
router.put('/:id', (_req, res) => {
  res.status(501).json({ error: 'No implementado: edicion de Ticket con control de concurrencia pendiente (ver docs/specs.md, RF-16).' });
});

// RF-02/RF-06 (Cerrado): archivo logico, solo el Administrador puede ejecutarlo.
router.delete('/:id', (_req, res) => {
  res.status(501).json({ error: 'No implementado: archivado de Ticket pendiente (ver docs/specs.md, RF-02).' });
});

// RF-05/RF-06 (Cerrado): solo el Administrador puede asignar/reasignar un responsable.
router.post('/:id/asignar', (_req, res) => {
  res.status(501).json({ error: 'No implementado: asignacion de responsable pendiente (ver docs/specs.md, RF-05).' });
});

// RF-11 (Cerrado): comentarios dentro de un ticket (autor y fecha visibles).
router.post('/:id/comentarios', (_req, res) => {
  res.status(501).json({ error: 'No implementado: comentarios pendiente (ver docs/specs.md, RF-11).' });
});

export default router;
