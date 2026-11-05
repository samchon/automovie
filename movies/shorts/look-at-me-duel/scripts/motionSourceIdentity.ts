import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Read the actual production and public runtime source identities.
 * @evidence contracts/common.md#implementation-and-ownership SHA256 covers each regular source file in the same four owners as the real Viewer observer. This is a byte identity check, not a replacement for physical or visual admission. No package or production file is modified.
 * @evidence contracts/common.md#authoring-interface Resolve from this tracked module, independent of the shell cwd. Use before/after sealing or capture to distinguish the observed runtime from a later workspace revision. Returns relative paths and digests; filesystem errors refuse the operation.
 */
export async function motionSourceIdentity(): Promise<Record<string, Record<string, string>>> {
  /** Walk one actual source owner in native construction order. */
  async function tree(directory: string, prefix: string = ""): Promise<Record<string, string>> {
    const rows: Record<string, string> = {};
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const relative: string = prefix + item.name; const full: string = path.join(directory, item.name);
      if (item.isDirectory()) Object.assign(rows, await tree(full, relative + "/"));
      else if (item.isFile()) rows[relative] = createHash("sha256").update(await readFile(full)).digest("hex");
    }
    return rows;
  }
  return { production: await tree(fileURLToPath(new URL("../src/", import.meta.url))), human: await tree(fileURLToPath(new URL("../../../../packages/human/src/", import.meta.url))), engine: await tree(fileURLToPath(new URL("../../../../packages/engine/src/", import.meta.url))), viewer: await tree(fileURLToPath(new URL("../../../../packages/viewer/src/", import.meta.url))) };
}

/**
 * Hash a retained media or bundle file without a second full in-memory copy.
 * @evidence contracts/common.md#implementation-and-ownership Streams exact file bytes through Node SHA256; it neither transcodes nor normalizes them.
 * @evidence contracts/common.md#authoring-interface Supply an existing path. Returns lowercase64hex or rejects on I/O failure. The caller owns path authorization, retention and semantic validation.
 */
export async function motionFileDigest(file: string): Promise<string> {
  const hash: ReturnType<typeof createHash> = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
