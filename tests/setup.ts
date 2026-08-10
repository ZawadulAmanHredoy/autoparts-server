import { readFileSync } from "node:fs";
import { MONGOD_URI_FILE } from "./paths";

// Runs before every test file, before any server source module is imported.
// env.ts reads process.env at import time, so these must be set here.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = readFileSync(MONGOD_URI_FILE, "utf8").trim();
process.env.CLIENT_URL = "http://localhost:5173";
process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789abcdef";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-0123456789abcdef";
