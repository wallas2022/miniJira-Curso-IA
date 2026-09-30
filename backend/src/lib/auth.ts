import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// RNF-04: sesiones con expiracion, autorizacion por rol validada en el backend.
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-no-usar-en-produccion';
const JWT_EXPIRES_IN = '8h';

export type AuthUser = {
  id: string;
  email: string;
  rol: 'ADMIN' | 'USUARIO';
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  try {
    const token = header.slice('Bearer '.length);
    req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesion invalida o expirada.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Requiere rol Administrador.' });
  }
  next();
}
