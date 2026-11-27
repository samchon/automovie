import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Read one fixed atlas reference relative to its owning document and verify its bytes.
 * Returns the admitted bytes and absolute path; a mismatch throws before observation.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Resolve the declared path against the caller's base with path.resolve and require the complete-byte SHA-256 to equal the declared identity. The helper does not confine the resolved path to that base.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reading and hashing are O(B) in file bytes. The synchronous read opens and closes its own descriptor. It allocates the complete file before hash verification without a byte ceiling and transfers that same buffer on success. The caller owns schema and geometry admission.
 * @evidence contracts/development/common.md#meaningful-documentation States relative ownership, returned data and mismatch failure effects.
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
