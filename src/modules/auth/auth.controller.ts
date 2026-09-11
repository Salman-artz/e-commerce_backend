import type { Request, Response } from 'express';
import { authService } from './auth.service';

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, authService.refreshTokenCookieOptions);
}

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  },

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.body.refreshToken ?? req.cookies?.refreshToken;

    const result = await authService.refresh(refreshToken);
    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  },

  async logout(req: Request, res: Response) {
    if (req.user) {
      await authService.logout(req.user.id);
    }

    res.clearCookie('refreshToken', authService.refreshTokenCookieOptions);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id);

    res.json({
      success: true,
      message: 'User profile loaded',
      data: user
    });
  },

  async updateProfile(req: Request, res: Response) {
    const user = await authService.updateProfile(req.user!.id, req.body);

    res.json({
      success: true,
      message: 'Profile updated',
      data: user
    });
  }
};