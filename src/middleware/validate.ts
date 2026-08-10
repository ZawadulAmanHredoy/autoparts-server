import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "./errorHandler.js";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        throw new AppError(400, "Validation failed", {
          code: "VALIDATION_ERROR",
          details: result.error.flatten(),
        });
      }
      req[source] = result.data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new AppError(400, "Validation failed", {
            code: "VALIDATION_ERROR",
            details: err.flatten(),
          }),
        );
        return;
      }
      next(err);
    }
  };
}
