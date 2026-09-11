import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../common/app-error';
import { authRepository } from './auth.repository';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schemas';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const isProduction = env.NODE_ENV === 'production';

const refreshTokenCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  secure: isProduction,
  path: '/auth'
};

function sanitizeUser(user: { id: number; name: string; email: string; role: Role }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function signTokens(user: AuthUser): AuthTokens {
  const accessToken = jwt.sign(user, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });

  const refreshToken = jwt.sign(user, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });

  return { accessToken, refreshToken };
}

async function persistRefreshToken(userId: number, refreshToken: string) {
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await authRepository.updateRefreshTokenHash(userId, refreshTokenHash);
}

export const authService = {
  refreshTokenCookieOptions,

  async register(input: RegisterInput) {
    const existingUser = await authRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash
    });

    await authRepository.createCart(user.id);

    const authUser = sanitizeUser(user);
    const tokens = signTokens(authUser);
    await persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: authUser,
      ...tokens
    };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const authUser = sanitizeUser(user);
    const tokens = signTokens(authUser);
    await persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: authUser,
      ...tokens
    };
  },

  async refresh(refreshToken: string) {
    let payload: AuthUser;

    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthUser;
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
    }

    const user = await authRepository.findById(payload.id);

    if (!user?.refreshTokenHash) {
      throw new AppError(401, 'UNAUTHORIZED', 'Refresh token is not valid');
    }

    const isTokenMatched = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isTokenMatched) {
      throw new AppError(401, 'UNAUTHORIZED', 'Refresh token is not valid');
    }

    const authUser = sanitizeUser(user);
    const tokens = signTokens(authUser);
    await persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: authUser,
      ...tokens
    };
  },

  async logout(userId: number) {
    await authRepository.updateRefreshTokenHash(userId, null);
  },

  async me(userId: number) {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return sanitizeUser(user);
  },

  async updateProfile(userId: number, input: UpdateProfileInput) {
    const user = await authRepository.updateProfile(userId, { name: input.name });

    return sanitizeUser(user);
  }
};