import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { InventoryLog } from "../src/models/inventoryLog.model.js";
import { Part } from "../src/models/part.model.js";
import {
  api,
  authCookie,
  clearDb,
  createPart,
  createUser,
  startDb,
  stopDb,
  validOrderBody,
} from "./helpers";
import type { UserDoc } from "../src/models/user.model.js";

async function addToCart(user: UserDoc, partId: string, quantity = 1): Promise<void> {
  await api
    .put("/api/cart/items")
    .set("Cookie", authCookie(user))
    .send({ partId, quantity });
}

describe("orders", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(clearDb);

  it("POST /api/orders without auth → 401", async () => {
    const res = await api.post("/api/orders").send(validOrderBody);
    expect(res.status).toBe(401);
  });

  it("POST /api/orders with empty cart → 400", async () => {
    const user = await createUser();
    const res = await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/empty/i);
  });

  it("dev-mode order → 201 Processing, correct totals, stock decremented, cart cleared", async () => {
    const user = await createUser();
    const part = await createPart({ stockCount: 10, price: 50 });
    await addToCart(user, part.id, 2);

    const res = await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);
    expect(res.status).toBe(201);
    expect(res.body.mode).toBe("dev");

    const order = res.body.order;
    expect(order.status).toBe("Processing");
    expect(order.subtotal).toBe(100);
    expect(order.tax).toBe(8);
    expect(order.shippingFee).toBe(8);
    expect(order.total).toBe(116);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(2);

    const fresh = await Part.findById(part.id);
    expect(fresh!.stockCount).toBe(8);
    expect(fresh!.inStock).toBe(true);

    const log = await InventoryLog.findOne({ orderId: order.id });
    expect(log?.delta).toBe(-2);

    const cart = await api.get("/api/cart").set("Cookie", authCookie(user));
    expect(cart.body.items).toEqual([]);
  });

  it("express delivery method → shippingFee 25", async () => {
    const user = await createUser();
    const part = await createPart({ price: 10 });
    await addToCart(user, part.id, 1);

    const res = await api
      .post("/api/orders")
      .set("Cookie", authCookie(user))
      .send({ ...validOrderBody, deliveryMethod: "express" });
    expect(res.status).toBe(201);
    expect(res.body.order.shippingFee).toBe(25);
  });

  it("POST /api/orders with insufficient stock → 409", async () => {
    const user = await createUser();
    const part = await createPart({ stockCount: 1 });
    await addToCart(user, part.id, 5);
    const res = await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/out of stock/i);
  });

  it("GET /api/orders/me → only own orders, newest first", async () => {
    const user = await createUser();
    const part = await createPart();
    await addToCart(user, part.id);
    await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);

    const res = await api.get("/api/orders/me").set("Cookie", authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].customerEmail).toBe(user.email);
  });

  it("GET /api/orders/:id → owner 200, other user 403", async () => {
    const user = await createUser();
    const other = await createUser();
    const part = await createPart();
    await addToCart(user, part.id);
    const created = await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);
    const orderId = created.body.order.id;

    const ok = await api.get(`/api/orders/${orderId}`).set("Cookie", authCookie(user));
    expect(ok.status).toBe(200);
    expect(ok.body.id).toBe(orderId);

    const forbidden = await api.get(`/api/orders/${orderId}`).set("Cookie", authCookie(other));
    expect(forbidden.status).toBe(403);
  });

  it("POST /api/orders/:id/pay is idempotent (no double stock decrement)", async () => {
    const user = await createUser();
    const part = await createPart({ stockCount: 5 });
    await addToCart(user, part.id, 1);
    const created = await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);
    const orderId = created.body.order.id;
    expect(created.body.order.status).toBe("Processing");

    const res = await api.post(`/api/orders/${orderId}/pay`).set("Cookie", authCookie(user));
    expect(res.status).toBe(200);

    const fresh = await Part.findById(part.id);
    expect(fresh!.stockCount).toBe(4);
  });
});
