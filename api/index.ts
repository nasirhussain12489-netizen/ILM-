import type { Request, Response } from 'express';
import { app } from '../server.ts';

export default function handler(req: Request, res: Response) {
  if (req.query?.path && typeof req.query.path === 'string' && req.query.path.startsWith('/api')) {
    req.url = req.query.path;
  }
  return app(req, res);
}
