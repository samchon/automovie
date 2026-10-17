import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { ReferenceManifest } from "./ReferenceManifest.ts";

/**
 * Reads one declared private input as verified bytes, rejecting path escapes and stale hashes.
 *
 * @evidence contracts/common.md#principled-implementation Resolves the actual root and target, checks containment and hashes the same buffer returned to the consumer.
 * @evidence contracts/common.md#clear-and-simple-design Owns byte admission; readInput adds JSON parsing and producers own their data semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing identities, escaped paths and mismatching complete hashes throw instead of using a fallback.
 * @evidence contracts/common.md#meaningful-documentation States named manifest input, complete-byte verification and rejected path mutation.
 * @evidence contracts/performance.md#efficient-algorithms Resolves one native path and reads and hashes one complete file; time and memory scale with its bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work No cache is held because a previous path or digest does not establish current bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous filesystem calls close their descriptors; returned buffer ownership transfers to the caller without retained module state.
 */
export function readBytes(manifest: ReferenceManifest, id: string): Buffer {
  const entry: ReferenceManifest["files"][string] | undefined =
    manifest.files[id];
  if (!entry) throw new Error(`Missing declared reference input: ${id}`);
  const root: string = fs.realpathSync(manifest.root);
  const file: string = fs.realpathSync(path.resolve(root, entry.path));
  const relative: string = path.relative(root, file);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error(`Reference input leaves its private root: ${id}`);
  const bytes: Buffer = fs.readFileSync(file);
  const actual: string = crypto
    .createHash("sha256")
    .update(bytes)
    .digest("hex");
  if (actual !== entry.sha256.toLowerCase())
    throw new Error(`Reference input hash changed: ${id}`);
  return bytes;
}
