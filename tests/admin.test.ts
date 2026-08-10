import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { api, authCookie, clearDb, createPart, createUser, startDb, stopDb, validOrderBody } from "./helpers";

describe("admin", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(clearDb);

  const newPartBody = {
    name: "Test Rotor",
    brand: "ApexBrake",
    partNumber: "ROTOR-1",
    oemNumber: "OEM-9",
    category: "Brakes",
    subcategory: "Rotors",
    price: 89.99,
    stockCount: 4,
    images: ["https://images.unsplash.com/photo-1"],
    description: "Drilled and slotted rotor",
    difficulty: "Easy",
    estimatedInstallTime: "30 min",
    warranty: "2 years",
  };

  it("GET /api/admin/stats without auth → 401", async () => {
    const res = await api.get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stats as customer → 403", async () => {
    const customer = await createUser();
    const res = await api.get("/api/admin/stats").set("Cookie", authCookie(customer));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("GET /api/admin/stats as admin → 200 with stats", async () => {
    const admin = await createUser({ role: "admin" });
    const res = await api.get("/api/admin/stats").set("Cookie", authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(1);
    expect(typeof res.body.totalRevenue).toBe("number");
    expect(typeof res.body.totalParts).toBe("number");
    expect(Array.isArray(res.body.topParts)).toBe(true);
  });

  it("POST /api/admin/parts → 201 and recomputes inStock from stockCount", async () => {
    const admin = await createUser({ role: "admin" });
    const res = await api
      .post("/api/admin/parts")
      .set("Cookie", authCookie(admin))
      .send({ ...newPartBody, stockCount: 0 });
    expect(res.status).toBe(201);
    expect(res.body.inStock).toBe(false);
  });

  it("POST /api/admin/parts duplicate partNumber → 409", async () => {
    const admin = await createUser({ role: "admin" });
    await createPart({ partNumber: "DUP-1" });
    const res = await api
      .post("/api/admin/parts")
      .set("Cookie", authCookie(admin))
      .send({ ...newPartBody, partNumber: "DUP-1" });
    expect(res.status).toBe(409);
  });

  it("POST /api/admin/parts invalid body → 400 VALIDATION_ERROR", async () => {
    const admin = await createUser({ role: "admin" });
    const res = await api.post("/api/admin/parts").set("Cookie", authCookie(admin)).send({ name: "x" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("PATCH /api/admin/users/:id/role promotes a user", async () => {
    const admin = await createUser({ role: "admin" });
    const customer = await createUser();
    const res = await api
      .patch(`/api/admin/users/${customer.id}/role`)
      .set("Cookie", authCookie(admin))
      .send({ role: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
  });

  it("PATCH self-demotion → 400", async () => {
    const admin = await createUser({ role: "admin" });
    const res = await api
      .patch(`/api/admin/users/${admin.id}/role`)
      .set("Cookie", authCookie(admin))
      .send({ role: "customer" });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/admin/orders/:id/status updates fulfillment status", async () => {
    const admin = await createUser({ role: "admin" });
    const user = await createUser();
    const part = await createPart();
    await api.put("/api/cart/items").set("Cookie", authCookie(user)).send({ partId: part.id, quantity: 1 });
    const created = await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);
    const orderId = created.body.order.id;

    const res = await api
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Cookie", authCookie(admin))
      .send({ status: "Shipped", trackingNumber: "TRK123" });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("Shipped");
    expect(res.body.order.trackingNumber).toBe("TRK123");
  });

  it("DELETE /api/admin/parts/:id with order history → 409", async () => {
    const admin = await createUser({ role: "admin" });
    const user = await createUser();
    const part = await createPart();
    await api.put("/api/cart/items").set("Cookie", authCookie(user)).send({ partId: part.id, quantity: 1 });
    await api.post("/api/orders").set("Cookie", authCookie(user)).send(validOrderBody);

    const res = await api.delete(`/api/admin/parts/${part.id}`).set("Cookie", authCookie(admin));
    expect(res.status).toBe(409);
  });

  it("DELETE /api/admin/parts/:id without order history → 200, then 404", async () => {
    const admin = await createUser({ role: "admin" });
    const part = await createPart();
    const res = await api.delete(`/api/admin/parts/${part.id}`).set("Cookie", authCookie(admin));
    expect(res.status).toBe(200);
    const again = await api.delete(`/api/admin/parts/${part.id}`).set("Cookie", authCookie(admin));
    expect(again.status).toBe(404);
  });
});
