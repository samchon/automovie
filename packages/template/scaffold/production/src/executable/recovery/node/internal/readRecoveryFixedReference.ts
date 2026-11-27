import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/*
 * Read one fixed atlas reference relative to its owning document and verify its bytes.
 * Returns the admitted bytes and absolute path; a mismatch throws before observation.
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
