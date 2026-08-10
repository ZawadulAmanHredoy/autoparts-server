import os from "node:os";
import path from "node:path";

/** Shared location for the in-memory MongoDB URI, handed off from the
 *  global setup (separate process) to the worker setup files. */
export const TEST_DIR = path.join(os.tmpdir(), "autoparts-tests");
export const MONGOD_URI_FILE = path.join(TEST_DIR, "mongod-uri");
