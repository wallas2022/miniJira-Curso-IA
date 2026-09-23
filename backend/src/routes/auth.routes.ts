import { Router } from 'express';

const router = Router();

// RF-07 (Cerrado): login propio email + contrasena. Sin registro publico:
// las cuentas las crea el Administrador. Logica de negocio pendiente de implementar.
router.post('/login', (_req, res) => {
  res.status(501).json({ error: 'No implementado: logica de login pendiente (ver docs/specs.md, RF-07).' });
});

export default router;
