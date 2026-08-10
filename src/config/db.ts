import mongoose from "mongoose";
import logger from "./logger.js";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);
  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
