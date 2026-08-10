import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { api, authCookie, clearDb, createUser, startDb, stopDb } from "./helpers";

describe("auth", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(clearDb);

  it("GET /health → 200 ok", async () => {
    const res = await api.get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/auth/me without cookie → 401 UNAUTHORIZED", async () => {
    const res = await api.get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/auth/me with cookie → 200 profile", async () => {
    const user = await createUser({ name: "Alice", email: "alice@example.com" });
    const res = await api.get("/api/auth/me").set("Cookie", authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.name).toBe("Alice");
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user.role).toBe("customer");
  });

  it("GET /api/auth/me with a forged token → 401", async () => {
    const res = await api.get("/api/auth/me").set("Cookie", "accessToken=forged.jwt.token");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/logout → 200 success", async () => {
    const res = await api.post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/auth/status → 200 ok", async () => {
    const res = await api.get("/api/auth/status");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.googleConfigured).toBe("boolean");
  });

  it("unknown route → 404 with requestId", async () => {
    const res = await api.get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.requestId).toBeDefined();
  });
});
