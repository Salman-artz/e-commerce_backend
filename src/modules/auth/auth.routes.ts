import { Router } from 'express';
import { authController } from './auth.controller';
import { loginSchema, refreshTokenSchema, registerSchema, updateProfileSchema } from './auth.schemas';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
authRouter.post('/logout', requireAuth, authController.logout);
authRouter.get('/me', requireAuth, authController.me);
authRouter.patch('/me', requireAuth, validate(updateProfileSchema), authController.updateProfile);