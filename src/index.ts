import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env, isProduction } from "./config/env.js";
import logger from "./config/logger.js";

async function bootstrap(): Promise<void> {
  const app = createApp();
  const server = createServer(app);

  await connectDb();

  server.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      "AutoParts Express server started",
    );
    if (!isProduction) {
      logger.info(`API docs: http://localhost:${env.PORT}/api-docs`);
    }
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, "Shutting down");
    server.close(() => {
      void disconnectDb().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err: unknown) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
