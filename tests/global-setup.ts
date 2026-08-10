import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MONGOD_URI_FILE, TEST_DIR } from "./paths";

/** Prefer the locally installed MongoDB (Windows dev) to avoid a ~70 MB
 *  binary download; in CI (no system mongod) mongodb-memory-server falls
 *  back to downloading its own build. */
const SYSTEM_MONGOD = "D:\\mongodb\\mongodb-win32-x86_64-windows-8.3.7\\bin\\mongod.exe";

let mongod: MongoMemoryServer | null = null;

export default async function setup(): Promise<() => Promise<void>> {
  await rm(MONGOD_URI_FILE, { force: true });
  await mkdir(TEST_DIR, { recursive: true });

  const options = existsSync(SYSTEM_MONGOD)
    ? { binary: { systemBinary: SYSTEM_MONGOD } }
    : {};

  mongod = await MongoMemoryServer.create(options);
  await writeFile(MONGOD_URI_FILE, mongod.getUri(), "utf8");

  return async () => {
    await mongod?.stop();
    mongod = null;
    await rm(MONGOD_URI_FILE, { force: true });
  };
}
