import { Router } from "express";
import { schemas } from "../shared/index.js";
import {
  addVehicle,
  deleteVehicle,
  getMe,
  listVehicles,
  updateMe,
  updateVehicle,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: Profile and garage vehicles
 */
const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/me", getMe);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: Update my profile
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               address:
 *                 type: object
 *                 properties:
 *                   street: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   zip: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch("/me", validate(schemas.profileUpdate, "body"), updateMe);

/**
 * @openapi
 * /api/users/me/vehicles:
 *   get:
 *     summary: List garage vehicles
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Garage vehicles
 */
router.get("/me/vehicles", listVehicles);

/**
 * @openapi
 * /api/users/me/vehicles:
 *   post:
 *     summary: Add a garage vehicle
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [year, make, model]
 *             properties:
 *               year: { type: integer }
 *               make: { type: string }
 *               model: { type: string }
 *               engine: { type: string }
 *               trim: { type: string }
 *               vin: { type: string }
 *               isPrimary: { type: boolean }
 *     responses:
 *       201:
 *         description: Vehicle added
 *       400:
 *         description: Validation failed
 */
router.post("/me/vehicles", validate(schemas.vehicle, "body"), addVehicle);

/**
 * @openapi
 * /api/users/me/vehicles/{id}:
 *   patch:
 *     summary: Update a garage vehicle
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Vehicle updated
 */
router.patch("/me/vehicles/:id", validate(schemas.idParam, "params"), updateVehicle);

/**
 * @openapi
 * /api/users/me/vehicles/{id}:
 *   delete:
 *     summary: Remove a garage vehicle
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vehicle removed
 */
router.delete("/me/vehicles/:id", validate(schemas.idParam, "params"), deleteVehicle);

export default router;
