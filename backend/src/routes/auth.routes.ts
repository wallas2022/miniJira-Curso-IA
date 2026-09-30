import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth, signToken } from '../lib/auth';

const router = Router();

// RF-07: login propio email + contrasena. Sin registro publico.
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contrasena son obligatorios.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo) {
    return res.status(401).json({ error: 'Email o contrasena incorrectos.' });
  }

  const valido = await bcrypt.compare(password, user.passwordHash);
  if (!valido) {
    return res.status(401).json({ error: 'Email o contrasena incorrectos.' });
  }

  const authUser = { id: user.id, email: user.email, rol: user.rol as 'ADMIN' | 'USUARIO' };
  const token = signToken(authUser);
  res.json({ token, user: authUser });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
