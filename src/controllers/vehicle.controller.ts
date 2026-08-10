import type { Request, Response } from "express";
import { decodeVin } from "../services/vinDecoder.js";

export function decodeVinHandler(req: Request, res: Response): void {
  const { vin } = req.params as { vin: string };
  const decoded = decodeVin(vin);
  res.json({ vehicle: decoded });
}
