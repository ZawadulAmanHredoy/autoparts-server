import { parseArgs } from "node:util";
import { connectDb, disconnectDb } from "../config/db.js";
import logger from "../config/logger.js";
import { User } from "../models/user.model.js";
import { adminEmails, env } from "../config/env.js";

/**
 * Promote Google users to admin by email.
 * Usage:
 *   npm run seed:admin -- --email you@gmail.com,admin@example.com
 *   npm run seed:admin -- --all          # promote every user in ADMIN_EMAILS
 */
async function seedAdmin(): Promise<void> {
  const { values } = parseArgs({
    options: {
      email: { type: "string", multiple: true },
      all: { type: "boolean", default: false },
    },
  });

  const emails = new Set<string>();
  if (values.all) {
    adminEmails.forEach((e) => emails.add(e));
  }
  (values.email ?? []).forEach((e) => emails.add(e.trim().toLowerCase()));

  if (emails.size === 0) {
    logger.warn(
      "No emails provided. Use --email a@b.com or --all (uses ADMIN_EMAILS in .env).",
    );
    return;
  }

  await connectDb();

  const result = await User.updateMany(
    { email: { $in: [...emails] } },
    { $set: { role: "admin" } },
  );
  logger.info({ matched: result.matchedCount, modified: result.modifiedCount }, "Admin promotion complete");

  const missing = await User.find({ email: { $in: [...emails] } }, { email: 1 });
  const found = new Set(missing.map((u) => u.email));
  const notFound = [...emails].filter((e) => !found.has(e));
  if (notFound.length > 0) {
    logger.warn({ emails: notFound }, "These emails have not signed up yet — promote again after they log in");
  }

  logger.info(`Admin emails configured in env: ${[...adminEmails].join(", ") || "(none)"} (${env.GOOGLE_CLIENT_ID ? "Google OAuth configured" : "GOOGLE_CLIENT_ID missing"})`);
  await disconnectDb();
}

seedAdmin().catch((err) => {
  logger.error({ err }, "Admin seeding failed");
  process.exit(1);
});
