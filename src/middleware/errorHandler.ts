import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import logger from "../config/logger.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, options?: { code?: string; details?: unknown }) {
    super(message);
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`, { code: "NOT_FOUND" });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, message, { code: "UNAUTHORIZED" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, message, { code: "FORBIDDEN" });
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) {
    return new AppError(400, "Validation failed", {
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    });
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, `Invalid ${err.path} value`, { code: "INVALID_ID" });
  }
  return new AppError(500, "Internal server error");
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const appError = toAppError(err);
  if (appError.statusCode >= 500) {
    logger.error({ err, reqId: req.id }, "Unhandled error");
  }
  res.status(appError.statusCode).json({
    statusCode: appError.statusCode,
    message: appError.message,
    code: appError.code,
    details: appError.details,
    requestId: req.id,
  });
};
