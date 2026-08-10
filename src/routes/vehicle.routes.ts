import { Router } from "express";
import { schemas } from "../shared/index.js";
import { decodeVinHandler } from "../controllers/vehicle.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

/**
 * @openapi
 * tags:
 *   name: Vehicles
 *   description: VIN decoding
 */
const router = Router();

/**
 * @openapi
 * /api/vehicles/decode/{vin}:
 *   get:
 *     summary: Decode a VIN
 *     description: Returns make, model, year (and engine where known) for a
 *       17-character VIN. Uses a deterministic local decoder in development.
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema: { type: string, pattern: '^[A-HJ-NPR-Z0-9]{17}$' }
 *     responses:
 *       200:
 *         description: Decoded vehicle
 *       400:
 *         description: Invalid VIN
 */
router.get(
  "/decode/:vin",
  requireAuth,
  validate(schemas.vinDecode, "params"),
  decodeVinHandler,
);

export default router;
