import type { Request, Response } from "express";
import { env } from "../config/env.js";
import logger from "../config/logger.js";
import type { UserDoc } from "../models/user.model.js";
import {
  clearAuthCookies,
  createRefreshToken,
  revokeRefreshToken,
  REFRESH_COOKIE,
  setAuthCookies,
  signAccessToken,
  toPublicUser,
} from "../services/token.service.js";

export async function googleCallbackHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as UserDoc | undefined;
  if (!user) {
    res.redirect(`${env.CLIENT_URL}/auth?error=signin_failed`);
    return;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  setAuthCookies(res, accessToken, refreshToken);
  res.redirect(`${env.CLIENT_URL}/auth/success`);
}

export function meHandler(req: Request, res: Response): void {
  const user = req.user as UserDoc;
  res.json({ user: toPublicUser(user) });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken);
    } catch (err) {
      logger.warn({ err }, "Error revoking refresh token on logout");
    }
  }
  clearAuthCookies(res);
  res.json({ success: true });
}

export function authStatusHandler(_req: Request, res: Response): void {
  res.json({ status: "ok", googleConfigured: Boolean(env.GOOGLE_CLIENT_ID) });
}
