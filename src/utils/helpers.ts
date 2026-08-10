import { AppError } from "../middleware/errorHandler.js";

export function toObjectIdString(id: string): string {
  if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new AppError(400, "Invalid identifier");
  }
  return id;
}

export function assertAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError(500, "Internal server error");
}
