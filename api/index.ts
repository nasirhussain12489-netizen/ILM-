import type { Request, Response } from 'express';
import { app } from '../server.ts';

export default function handler(req: Request, res: Response) {
  if (req.query?.path && typeof req.query.path === 'string') {
    const targetPath = req.query.path.startsWith('/')
      ? req.query.path
      : `/${req.query.path}`;
    delete req.query.path;
    req.url = targetPath;
  }
  return app(req, res);
}
