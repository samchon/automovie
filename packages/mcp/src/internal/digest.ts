import { createHash } from "node:crypto";

/** Identify exact source bytes or the ordered layer revision declaration. */
export const digest = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");
