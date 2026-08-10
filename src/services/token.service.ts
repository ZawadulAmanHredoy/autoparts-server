import type { Response } from "express";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { env, isProduction } from "../config/env.js";
import { RefreshToken } from "../models/refreshToken.model.js";
import { User, type UserDoc } from "../models/user.model.js";
import type { User as PublicUser } from "../shared/index.js";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

interface AccessPayload {
  sub: string;
  role: string;
  type: "access";
}

interface RefreshPayload {
  sub: string;
  type: "refresh";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(user: UserDoc): string {
  const payload: AccessPayload = { sub: user.id, role: user.role, type: "access" };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

function signRefreshToken(userId: string): string {
  const payload: RefreshPayload = { sub: userId, type: "refresh" };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export async function createRefreshToken(
  user: UserDoc,
  meta: { userAgent?: string; ip?: string },
): Promise<string> {
  const token = signRefreshToken(user.id);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + msFromEnv(env.JWT_REFRESH_EXPIRES_IN)),
    userAgent: meta.userAgent?.slice(0, 300),
    ip: meta.ip,
  });
  return token;
}

export async function rotateRefreshToken(
  token: string,
  meta: { userAgent?: string; ip?: string },
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: RefreshPayload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await User.findById(stored.userId);
  if (!user) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const newToken = await createRefreshToken(user, meta);
  stored.revokedAt = new Date();
  stored.replacedByTokenHash = hashToken(newToken);
  await stored.save();

  return { accessToken: signAccessToken(user), refreshToken: newToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) });
  if (stored && !stored.revokedAt) {
    stored.revokedAt = new Date();
    await stored.save();
  }
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const secure = isProduction;
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: msFromEnv(env.JWT_ACCESS_EXPIRES_IN),
    path: "/",
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: msFromEnv(env.JWT_REFRESH_EXPIRES_IN),
    path: "/",
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { httpOnly: true, path: "/", sameSite: "lax" });
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, path: "/", sameSite: "lax" });
}

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: String(user._id),
    googleId: user.googleId ?? undefined,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? undefined,
    role: user.role,
    phone: user.phone ?? undefined,
    address: user.address
      ? {
          street: user.address.street ?? "",
          city: user.address.city ?? "",
          state: user.address.state ?? "",
          zip: user.address.zip ?? "",
        }
      : undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

function msFromEnv(value: string): number {
  const unit = value.slice(-1).toLowerCase();
  const amount = Number.parseFloat(value);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const mult = multipliers[unit] ?? 60_000;
  return Math.round(amount * mult);
}
