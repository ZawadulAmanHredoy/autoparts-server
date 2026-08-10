import { Router } from "express";
import { schemas } from "../shared/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createOrder,
  getOrderById,
  myOrders,
  payOrderDev,
} from "../controllers/order.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Orders
 *   description: Checkout & order management
 */

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create an order and a Stripe PaymentIntent (dev mode auto-confirms)
 *     tags: [Orders]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   fullName: { type: string }
 *                   street: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   zip: { type: string }
 *               deliveryMethod: { type: string, enum: [standard, express] }
 *               paymentMethod: { type: string, enum: [card, google-pay, apple-pay] }
 *               notes: { type: string }
 *             required: [shippingAddress, deliveryMethod, paymentMethod]
 *     responses:
 *       201:
 *         description: Created order + payment intent
 *       400:
 *         description: Empty cart
 *       409:
 *         description: Out of stock
 */
router.post("/", requireAuth, validate(schemas.orderCreate), createOrder);

/**
 * @openapi
 * /api/orders/me:
 *   get:
 *     summary: List my orders (newest first)
 *     tags: [Orders]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Order list
 */
router.get("/me", requireAuth, myOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order (owner or admin)
 *     tags: [Orders]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         description: Not found
 */
router.get("/:id", requireAuth, validate(schemas.idParam, "params"), getOrderById);

/**
 * @openapi
 * /api/orders/{id}/pay:
 *   post:
 *     summary: Confirm payment (dev mode only, when Stripe is not configured)
 *     tags: [Orders]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Confirmed order
 *       403:
 *         description: Not available in Stripe mode
 */
router.post("/:id/pay", requireAuth, validate(schemas.idParam, "params"), payOrderDev);

export default router;
