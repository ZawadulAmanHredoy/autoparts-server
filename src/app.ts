import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { configureGoogleAuth } from "./services/googleAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { apiRateLimiter, requestLogger } from "./middleware/rateLimit.js";
import { stripeWebhook } from "./controllers/webhook.controller.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import orderRoutes from "./routes/order.routes.js";
import userRoutes from "./routes/user.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";

/** Body parser: raw buffer for the Stripe webhook (signature verification),
 *  JSON for everything else. */
function bodyParser(req: Request, res: Response, next: NextFunction): void {
  if (req.originalUrl === "/api/webhooks/stripe") {
    express.raw({ type: "*/*" })(req, res, next);
  } else {
    express.json({ limit: "1mb" })(req, res, next);
  }
}

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );

  app.use(bodyParser);
  app.use(cookieParser());
  app.use(passport.initialize());
  configureGoogleAuth();

  app.use(requestLogger);
  app.use("/api", apiRateLimiter);

  // Health
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Service health check
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // API Docs
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { explorer: true }),
  );

  // Routes
  /**
   * @swagger
   * /api/webhooks/stripe:
   *   post:
   *     summary: Stripe webhook (payment confirmations)
   *     description: Receives signed Stripe events. Verifies the Stripe signature
   *       and confirms orders on payment success (decrements stock, writes an
   *       inventory log, emails the customer). In dev mode without Stripe
   *       configured this endpoint is a no-op.
   *     tags: [Webhooks]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Webhook received
   *       400:
   *         description: Signature verification failed
   */
  app.post("/api/webhooks/stripe", stripeWebhook);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/vehicles", vehicleRoutes);
  app.use("/api", catalogRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);

  // 404 + errors
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
