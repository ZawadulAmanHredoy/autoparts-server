import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { api, authCookie, clearDb, createUser, startDb, stopDb } from "./helpers";

describe("validation & error handling", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(clearDb);

  it("GET /api/parts?limit=abc → 400 VALIDATION_ERROR", async () => {
    const res = await api.get("/api/parts?limit=abc");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/parts?limit=0 → 400", async () => {
    const res = await api.get("/api/parts?limit=0");
    expect(res.status).toBe(400);
  });

  it("GET /api/parts/:id with malformed id → 400 INVALID_ID", async () => {
    const res = await api.get("/api/parts/xyz");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_ID");
  });

  it("POST /api/orders with missing fields → 400", async () => {
    const user = await createUser();
    const res = await api.post("/api/orders").set("Cookie", authCookie(user)).send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/orders/:id/pay with malformed id → 400", async () => {
    const user = await createUser();
    const res = await api.post("/api/orders/not-an-id/pay").set("Cookie", authCookie(user));
    expect(res.status).toBe(400);
  });

  it("PATCH /api/admin/users/:id/role with bad role → 400", async () => {
    const admin = await createUser({ role: "admin" });
    const target = await createUser();
    const res = await api
      .patch(`/api/admin/users/${target.id}/role`)
      .set("Cookie", authCookie(admin))
      .send({ role: "superuser" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("error bodies echo the x-request-id header", async () => {
    const res = await api.get("/api/parts/xyz");
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });
});
