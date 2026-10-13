import { createHash } from "node:crypto";

/**
 * Identify exact source bytes or the ordered layer revision declaration.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-source Makes changed source discoverable independently of a client's remembered positions.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-source Computes the SHA-256 reference revision without an evidence-review fingerprint.
 */
export const digest = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");
