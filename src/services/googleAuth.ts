import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { adminEmails, env } from "../config/env.js";
import logger from "../config/logger.js";
import { User } from "../models/user.model.js";

export function configureGoogleAuth(): void {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    logger.warn("Google OAuth is not configured (missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL)");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("Google account has no verified email"));
          }

          const googleId = profile.id;
          const name = profile.displayName || profile.name?.givenName || email.split("@")[0];
          const avatar = profile.photos?.[0]?.value;

          let user = await User.findOne({ googleId });

          if (!user) {
            // First-time Google sign-in: auto-create account
            const existing = await User.findOne({ email });
            if (existing) {
              // Same email already in DB without googleId — link the Google account
              existing.googleId = googleId;
              if (!existing.avatar) existing.avatar = avatar;
              user = await existing.save();
            } else {
              const role = adminEmails.has(email) ? "admin" : "customer";
              user = await User.create({
                googleId,
                email,
                name,
                avatar,
                role,
              });
              logger.info({ userId: user.id, email }, "New user registered via Google");
            }
          } else {
            // Existing Google user — refresh profile fields opportunistically
            let changed = false;
            if (avatar && user.avatar !== avatar) {
              user.avatar = avatar;
              changed = true;
            }
            if (adminEmails.has(email) && user.role !== "admin") {
              user.role = "admin";
              changed = true;
            }
            if (changed) user = await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}
