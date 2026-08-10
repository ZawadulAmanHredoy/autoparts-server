import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { schemas } from "../shared/index.js";
import {
  createPart,
  deletePart,
  getStats,
  listInventoryLogs,
  listOrders,
  listParts,
  listUsers,
  updateOrderStatus,
  updatePart,
  updateUserRole,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin portal — stats, catalog, orders & users
 * security:
 *   - cookieAuth: []
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Store analytics dashboard stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Aggregated store stats
 *       403:
 *         description: Admin access required
 */
router.get("/stats", getStats);

/**
 * @swagger
 * /api/admin/parts:
 *   get:
 *     summary: List parts (search + category filter, paginated)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated parts
 *   post:
 *     summary: Create a new catalog part
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               brand: { type: string }
 *               partNumber: { type: string }
 *               oemNumber: { type: string }
 *               category: { type: string }
 *               subcategory: { type: string }
 *               price: { type: number }
 *               stockCount: { type: number }
 *               images: { type: array, items: { type: string } }
 *               description: { type: string }
 *             required: [name, brand, partNumber, price, stockCount, images]
 *     responses:
 *       201:
 *         description: Created part
 *       409:
 *         description: Duplicate part number
 */
router.get("/parts", listParts);
router.post("/parts", validate(schemas.part), createPart);

/**
 * @swagger
 * /api/admin/parts/{id}:
 *   put:
 *     summary: Update a part
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Updated part
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a part (blocked if it has order history)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       409:
 *         description: Part has order history
 */
router.put("/parts/:id", validate(schemas.idParam, "params"), validate(schemas.part), updatePart);
router.delete("/parts/:id", validate(schemas.idParam, "params"), deletePart);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: List all orders, optionally filtered by status
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Processing, Shipped, Delivered, Cancelled] }
 *     responses:
 *       200:
 *         description: Orders
 */
router.get("/orders", listOrders);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   patch:
 *     summary: Update an order's fulfillment status
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [Pending, Processing, Shipped, Delivered, Cancelled] }
 *               trackingNumber: { type: string }
 *             required: [status]
 *     responses:
 *       200:
 *         description: Updated order
 *       404:
 *         description: Not found
 */
router.patch(
  "/orders/:id/status",
  validate(schemas.idParam, "params"),
  validate(schemas.orderStatusUpdate),
  updateOrderStatus,
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List registered users
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users
 */
router.get("/users", listUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Promote or demote a user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [customer, admin] }
 *             required: [role]
 *     responses:
 *       200:
 *         description: Updated user
 *       400:
 *         description: Cannot demote self
 */
router.patch(
  "/users/:id/role",
  validate(schemas.idParam, "params"),
  validate(schemas.userRoleUpdate, "body"),
  updateUserRole,
);

/**
 * @swagger
 * /api/admin/inventory-logs:
 *   get:
 *     summary: Inventory audit trail
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Inventory change logs
 */
router.get("/inventory-logs", listInventoryLogs);

export default router;
