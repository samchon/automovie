import crypto from "node:crypto";

/** Hashes raw UTF-8 or binary bytes without normalization. */
export function productionGateHash(bytes: string | Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
