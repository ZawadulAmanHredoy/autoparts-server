import { Router } from "express";
import { schemas } from "../shared/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  clearCart,
  getCart,
  removeCartItem,
  upsertCartItem,
} from "../controllers/cart.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Cart
 *   description: Server-side shopping cart (per user)
 */

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: Get the current user's cart with full part details
 *     tags: [Cart]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart items + subtotal
 *       401:
 *         description: Authentication required
 */
router.get("/", requireAuth, getCart);

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     summary: Clear the cart
 *     tags: [Cart]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Empty cart
 */
router.delete("/", requireAuth, clearCart);

/**
 * @openapi
 * /api/cart/items:
 *   put:
 *     summary: Add/update an item quantity in the cart
 *     tags: [Cart]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partId: { type: string }
 *               quantity: { type: integer, minimum: 1, maximum: 99 }
 *             required: [partId, quantity]
 *     responses:
 *       200:
 *         description: Updated cart
 *       404:
 *         description: Part not found
 */
router.put("/items", requireAuth, validate(schemas.cartItem), upsertCartItem);

/**
 * @openapi
 * /api/cart/items/{partId}:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: partId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.delete("/items/:partId", requireAuth, validate(schemas.partIdParam, "params"), removeCartItem);

export default router;
