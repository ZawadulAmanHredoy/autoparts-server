import { Router } from "express";
import passport from "passport";
import {
  authStatusHandler,
  googleCallbackHandler,
  logoutHandler,
  meHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Google OAuth authentication
 */
const router = Router();

router.use(authRateLimiter);

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     description: Redirects the browser to Google's consent screen. On success
 *       Google redirects to /api/auth/google/callback which sets auth cookies.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to Google sign-in
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Verifies the Google response, upserts the user, issues
 *       access + refresh tokens as httpOnly cookies, and redirects to
 *       {CLIENT_URL}/auth/success.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to client app auth success
 *       400:
 *         description: Sign-in failed
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/status" }),
  googleCallbackHandler,
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Current user
 *     description: Returns the authenticated user's profile.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not authenticated
 */
router.get("/me", requireAuth, meHandler);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Sign out
 *     description: Revokes the refresh token and clears auth cookies.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Signed out
 */
router.post("/logout", logoutHandler);

/**
 * @openapi
 * /api/auth/status:
 *   get:
 *     summary: Auth service status
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Whether Google OAuth is configured
 */
router.get("/status", authStatusHandler);

export default router;
