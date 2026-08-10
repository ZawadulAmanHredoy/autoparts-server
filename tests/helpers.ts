import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { Category } from "../src/models/category.model.js";
import { Part } from "../src/models/part.model.js";
import { User, type UserDoc } from "../src/models/user.model.js";
import { signAccessToken } from "../src/services/token.service.js";

export const app = createApp();
export const api = request(app);

let indexed = false;

export async function startDb(): Promise<void> {
  await connectDb();
  if (!indexed) {
    await Part.syncIndexes();
    indexed = true;
  }
}

export async function stopDb(): Promise<void> {
  await disconnectDb();
}

export async function clearDb(): Promise<void> {
  if (!mongoose.connection.db) return;
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export function authCookie(user: UserDoc): string {
  return `accessToken=${signAccessToken(user)}`;
}

let userCounter = 0;

export async function createUser(
  overrides: Partial<{ name: string; email: string; role: "customer" | "admin" }> = {},
): Promise<UserDoc> {
  userCounter += 1;
  return User.create({
    name: overrides.name ?? "Test User",
    email: overrides.email ?? `user${userCounter}@example.com`,
    role: overrides.role ?? "customer",
    ...overrides,
  });
}

let partCounter = 0;

export async function createPart(overrides: Record<string, unknown> = {}) {
  partCounter += 1;
  return Part.create({
    name: "Ceramic Brake Pads",
    brand: "ApexBrake",
    partNumber: `APB-${randomUUID()}`,
    oemNumber: `OEM-${partCounter}`,
    category: "Brakes",
    subcategory: "Pads",
    price: 49.99,
    stockCount: 12,
    images: ["https://images.unsplash.com/photo-1"],
    description: "Ceramic brake pads with low dust formula",
    difficulty: "Easy",
    estimatedInstallTime: "45 min",
    warranty: "2 years",
    compatibility: { universal: true },
    ...overrides,
  });
}

export async function createCategory(name: string, slug: string) {
  return Category.create({ name, slug, icon: "brakes", sortOrder: 0 });
}

export const validOrderBody = {
  shippingAddress: {
    fullName: "Test User",
    street: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
  },
  deliveryMethod: "standard",
  paymentMethod: "card",
};
