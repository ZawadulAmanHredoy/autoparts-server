import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "./errorHandler.js";
import type { UserDoc } from "../models/user.model.js";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  rotateRefreshToken,
  setAuthCookies,
  verifyAccessToken,
} from "../services/token.service.js";
import { User } from "../models/user.model.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Passport declares Express.User as an empty interface; extend it so
    // req.user carries the full Mongoose user document.
    interface User extends UserDoc {}
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accessToken = req.cookies?.[ACCESS_COOKIE];
    if (!accessToken) throw new UnauthorizedError("Authentication required");

    let payload;
    try {
      payload = verifyAccessToken(accessToken);
    } catch {
      // Access token expired/invalid — attempt refresh rotation
      const refreshToken = req.cookies?.[REFRESH_COOKIE];
      if (!refreshToken) throw new UnauthorizedError("Session expired");
      try {
        const { accessToken: newAccess, refreshToken: newRefresh } = await rotateRefreshToken(
          refreshToken,
          { userAgent: req.headers["user-agent"], ip: req.ip },
        );
        setAuthCookies(res, newAccess, newRefresh);
        payload = verifyAccessToken(newAccess);
      } catch {
        throw new UnauthorizedError("Session expired");
      }
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new UnauthorizedError("User no longer exists");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Attach req.user when a valid access token is present; never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const accessToken = req.cookies?.[ACCESS_COOKIE];
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      const user = await User.findById(payload.sub);
      if (user) req.user = user;
    }
    next();
  } catch {
    next();
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    next(new ForbiddenError("Admin access required"));
    return;
  }
  next();
}
