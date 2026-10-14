import { createHash } from "node:crypto";

/**
 * Hash one explicit UTF-8 text for fixture observations.
 *
 * @evidence contracts/testing.md#behavioral-verification Node crypto hashes the exact UTF-8 text and returns a sha256-prefixed lowercase hex string used by snapshot and comparison arrangements.
 * @evidence contracts/testing.md#independent-expectations Node's SHA-256 algorithm and caller-authored text bytes define this identity independently of production's digest wrapper; tests using it still only prove their declared composition boundaries.
 * @evidence contracts/testing.md#distinguishing-cases Document, source, resident, generated and changed-text arrangements use the same byte rule; absent text is represented by callers as null instead of being hashed here.
 * @evidence contracts/testing.md#execution-ownership Each caller owns the supplied text and returned scalar; the crypto hash is invocation-local and no filesystem or production module is read.
 */
export const textDigest: (text: string) => string = (text: string): string =>
  `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
