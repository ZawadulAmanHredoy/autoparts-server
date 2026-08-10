import { Router } from "express";
import { listCategories, listParts, getPartById } from "../controllers/catalog.controller.js";
import { listDiagrams, listMaintenanceTasks } from "../controllers/guide.controller.js";
import { createReview, likeReview, listReviews } from "../controllers/review.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { schemas } from "../shared/index.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Catalog
 *     description: Parts catalog & categories
 *   - name: Diagrams
 *     description: Interactive schematics
 *   - name: Maintenance
 *     description: Maintenance schedule planner
 *   - name: Reviews
 *     description: Part reviews
 */

/**
 * @swagger
 * /api/diagrams:
 *   get:
 *     summary: List interactive schematic diagrams with part hotspots
 *     tags: [Diagrams]
 *     security: []
 *     responses:
 *       200:
 *         description: Diagrams with hotspots
 */
router.get("/diagrams", listDiagrams);

/**
 * @swagger
 * /api/maintenance-tasks:
 *   get:
 *     summary: List mileage-based maintenance schedules
 *     tags: [Maintenance]
 *     security: []
 *     responses:
 *       200:
 *         description: Maintenance tasks
 */
router.get("/maintenance-tasks", listMaintenanceTasks);


/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List part categories with product counts
 *     tags: [Catalog]
 *     security: []
 *     responses:
 *       200:
 *         description: Categories with counts
 */
router.get("/categories", listCategories);

/**
 * @swagger
 * /api/parts:
 *   get:
 *     summary: List parts with filtering, search, sort & pagination
 *     tags: [Catalog]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12, maximum: 48 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [popular, rating, price-asc, price-desc] }
 *       - in: query
 *         name: vehicleId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated parts
 */
router.get("/parts", validate(schemas.partQuery, "query"), listParts);

/**
 * @swagger
 * /api/parts/{id}:
 *   get:
 *     summary: Get a single part by id
 *     tags: [Catalog]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Part detail
 *       404:
 *         description: Not found
 */
router.get("/parts/:id", validate(schemas.idParam, "params"), getPartById);

/**
 * @swagger
 * /api/parts/{id}/reviews:
 *   get:
 *     summary: List reviews for a part (paginated)
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated reviews with liked flags
 *       404:
 *         description: Part not found
 *   post:
 *     summary: Add a review (one per user per part)
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
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
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               title: { type: string }
 *               comment: { type: string }
 *               vehicle: { type: string }
 *             required: [rating, title, comment]
 *     responses:
 *       201:
 *         description: Created review
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Already reviewed
 */
router.get("/parts/:id/reviews", optionalAuth, validate(schemas.idParam, "params"), listReviews);
router.post(
  "/parts/:id/reviews",
  requireAuth,
  validate(schemas.idParam, "params"),
  validate(schemas.review),
  createReview,
);

/**
 * @swagger
 * /api/parts/{id}/reviews/{reviewId}/like:
 *   post:
 *     summary: Toggle a like on a review
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: New liked state + like count
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Review not found
 */
router.post(
  "/parts/:id/reviews/:reviewId/like",
  requireAuth,
  validate(schemas.reviewIdParam, "params"),
  likeReview,
);

export default router;
