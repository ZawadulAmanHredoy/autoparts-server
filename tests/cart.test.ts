import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { api, authCookie, clearDb, createPart, createUser, startDb, stopDb } from "./helpers";

describe("cart", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(clearDb);

  it("GET /api/cart without auth → 401", async () => {
    const res = await api.get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("PUT /api/cart/items adds an item and computes subtotal", async () => {
    const user = await createUser();
    const part = await createPart({ price: 25 });
    const res = await api
      .put("/api/cart/items")
      .set("Cookie", authCookie(user))
      .send({ partId: part.id, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].part.id).toBe(part.id);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.subtotal).toBe(50);
  });

  it("PUT /api/cart/items with unknown part → 404", async () => {
    const user = await createUser();
    const res = await api
      .put("/api/cart/items")
      .set("Cookie", authCookie(user))
      .send({ partId: new mongoose.Types.ObjectId().toString(), quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("PUT /api/cart/items with quantity 0 → 400", async () => {
    const user = await createUser();
    const part = await createPart();
    const res = await api
      .put("/api/cart/items")
      .set("Cookie", authCookie(user))
      .send({ partId: part.id, quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("PUT again with the same part bumps the quantity", async () => {
    const user = await createUser();
    const part = await createPart();
    await api.put("/api/cart/items").set("Cookie", authCookie(user)).send({ partId: part.id, quantity: 1 });
    const res = await api
      .put("/api/cart/items")
      .set("Cookie", authCookie(user))
      .send({ partId: part.id, quantity: 2 });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(2);
  });

  it("DELETE /api/cart/items/:partId removes an item", async () => {
    const user = await createUser();
    const part = await createPart();
    await api.put("/api/cart/items").set("Cookie", authCookie(user)).send({ partId: part.id, quantity: 1 });
    const res = await api.delete(`/api/cart/items/${part.id}`).set("Cookie", authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.subtotal).toBe(0);
  });

  it("DELETE /api/cart clears the cart", async () => {
    const user = await createUser();
    const part = await createPart();
    await api.put("/api/cart/items").set("Cookie", authCookie(user)).send({ partId: part.id, quantity: 3 });
    const res = await api.delete("/api/cart").set("Cookie", authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.subtotal).toBe(0);
  });
});
