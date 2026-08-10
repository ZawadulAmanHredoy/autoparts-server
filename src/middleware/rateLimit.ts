import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import logger from "../config/logger.js";
import { isTest } from "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1_000_000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { statusCode: 429, message: "Too many requests, please try again later." },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 1_000_000 : 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { statusCode: 429, message: "Too many requests, please slow down." },
});

/** Assigns a request id, exposes it as `x-request-id`, and logs each response. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.id = randomUUID();
  res.setHeader("x-request-id", req.id);
  res.on("finish", () => {
    logger.info(
      { reqId: req.id, method: req.method, path: req.originalUrl, status: res.statusCode },
      "request",
    );
  });
  next();
}
