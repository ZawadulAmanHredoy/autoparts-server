import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Vehicle } from "../src/models/vehicle.model.js";
import { api, clearDb, createCategory, createPart, createUser, startDb, stopDb } from "./helpers";

describe("catalog", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(clearDb);

  it("GET /api/categories → items with live counts", async () => {
    await createCategory("Brakes", "brakes");
    await createPart({ category: "Brakes" });
    await createPart({ category: "Brakes" });
    const res = await api.get("/api/categories");
    expect(res.status).toBe(200);
    const brakes = res.body.items.find((c: { slug: string }) => c.slug === "brakes");
    expect(brakes.count).toBe(2);
  });

  it("GET /api/parts → default pagination", async () => {
    await createPart();
    await createPart();
    await createPart();
    const res = await api.get("/api/parts");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(12);
  });

  it("GET /api/parts → filters by category slug", async () => {
    await createCategory("Brakes", "brakes");
    await createPart({ category: "Brakes", name: "Front Pads" });
    await createPart({ category: "Engine", name: "Air Filter" });
    const res = await api.get("/api/parts?category=brakes");
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe("Front Pads");
  });

  it("GET /api/parts → inStock filter", async () => {
    await createPart({ name: "In Stock Part", stockCount: 5 });
    await createPart({ name: "Out Part", stockCount: 0, inStock: false });
    const res = await api.get("/api/parts?inStock=true");
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe("In Stock Part");
  });

  it("GET /api/parts → text search", async () => {
    await createPart({ name: "Brake Rotors", partNumber: "BR-1", description: "Drilled rotors" });
    await createPart({ name: "Spark Plugs", partNumber: "SP-1", description: "Iridium plugs" });
    const res = await api.get("/api/parts?search=brake");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe("Brake Rotors");
  });

  it("GET /api/parts → sort price-asc / price-desc", async () => {
    await createPart({ name: "Cheap", price: 10 });
    await createPart({ name: "Pricey", price: 100 });
    const asc = await api.get("/api/parts?sort=price-asc");
    expect(asc.body.items[0].price).toBe(10);
    const desc = await api.get("/api/parts?sort=price-desc");
    expect(desc.body.items[0].price).toBe(100);
  });

  it("GET /api/parts → limit=48 allowed, limit>48 rejected", async () => {
    const ok = await api.get("/api/parts?limit=48");
    expect(ok.status).toBe(200);
    expect(ok.body.limit).toBe(48);
    const over = await api.get("/api/parts?limit=999");
    expect(over.status).toBe(400);
  });

  it("GET /api/parts → vehicleId fitment filter", async () => {
    const user = await createUser();
    const vehicle = await Vehicle.create({
      userId: user._id,
      year: 2020,
      make: "Toyota",
      model: "Camry",
    });
    await createPart({ name: "Universal Part", compatibility: { universal: true } });
    await createPart({
      name: "Toyota Part",
      compatibility: { makes: ["Toyota"], models: ["Camry"], years: [2020] },
    });
    await createPart({ name: "Ford Part", compatibility: { makes: ["Ford"] } });

    const res = await api.get(`/api/parts?vehicleId=${vehicle.id}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const names = res.body.items.map((p: { name: string }) => p.name);
    expect(names).toContain("Universal Part");
    expect(names).toContain("Toyota Part");
  });

  it("GET /api/parts → unknown vehicleId returns empty list", async () => {
    const res = await api.get("/api/parts?vehicleId=not-a-real-id");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it("GET /api/parts/:id → part detail with reviews array", async () => {
    const part = await createPart({ name: "Rotors" });
    const res = await api.get(`/api/parts/${part.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Rotors");
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  it("GET /api/parts/:id missing → 404", async () => {
    const res = await api.get(`/api/parts/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  it("GET /api/parts/:id invalid → 400 INVALID_ID", async () => {
    const res = await api.get("/api/parts/not-an-object-id");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_ID");
  });
});
