import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Returns the SHA-256 identity of complete file bytes, without interpreting them.
 *
 * @evidence contracts/common.md#principled-implementation Uses the runtime's SHA-256 implementation on one complete file buffer, so the result identifies bytes rather than filenames or timestamps.
 * @evidence contracts/common.md#clear-and-simple-design Owns one byte-identity query without input interpretation or retained cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the requested file rather than substituting a declared or expected digest.
 * @evidence contracts/common.md#meaningful-documentation States the complete-byte scope and absence of semantic interpretation.
 * @evidence contracts/performance.md#efficient-algorithms File reading and hashing take linear time and memory in the file's byte length.
 * @evidence contracts/performance.md#reuse-equivalent-work Every call observes current bytes and retains no previous digest.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous read closes its descriptor; the local buffer becomes reclaimable after return and no handle persists.
 */
export function sha256(file: string): string {
  const bytes: Buffer = fs.readFileSync(file);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
