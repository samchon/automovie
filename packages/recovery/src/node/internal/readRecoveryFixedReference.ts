import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Read one fixed atlas reference relative to its owning document and verify its bytes.
 * Returns the admitted bytes and absolute path; a mismatch throws before observation.
 *
 * @evidence contracts/common.md#principled-implementation Resolve the declared relative path and require the complete-byte SHA-256 to equal the declared identity.
 * @evidence contracts/common.md#clear-and-simple-design This host helper owns byte admission while its caller owns schema and geometry admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternate path, changed byte sequence, source replacement or hash bypass is attempted.
 * @evidence contracts/common.md#meaningful-documentation States relative ownership, returned data and mismatch failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Reading and hashing are O(B) in file bytes and retain one B-byte buffer.
 * @evidence contracts/performance.md#reuse-equivalent-work The same read buffer is hashed and returned; this helper has no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous read closes its descriptor and transfers the buffer to the caller; no handle survives the call.
 */
export function readRecoveryFixedReference(
  reference: { path: string; sha256: string },
  relativeTo: string,
): { bytes: Buffer; file: string } {
  const file: string = path.resolve(relativeTo, reference.path),
    bytes: Buffer = fs.readFileSync(file);
  if (createHash("sha256").update(bytes).digest("hex") !== reference.sha256)
    throw new Error(`Fixed atlas-observation hash mismatch: ${file}`);
  return { bytes, file };
}
