import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../common/app-error';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate<T extends ZodTypeAny>(schema: T, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      next(new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.flatten()));
      return;
    }

    Object.defineProperty(req, target, { value: parsed.data, enumerable: true, writable: true });
    next();
  };
}