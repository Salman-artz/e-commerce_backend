import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../common/app-error';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: err.flatten()
    });

    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details
    });

    return;
  }

  if (err instanceof MulterError) {
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

    res.status(statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });

    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';

  console.error('Unhandled error:', err);
  try {
    const fs = require('fs');
    fs.appendFileSync('error.log', new Date().toISOString() + ' - ' + (err instanceof Error ? err.stack : String(err)) + '\n');
  } catch(e) {}

  res.status(500).json({
    success: false,
    message
  });
}