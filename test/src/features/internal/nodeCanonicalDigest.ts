import { createHash } from "node:crypto";

import { canonicalizeAutoMovieJson } from "../../../../packages/engine/src/text/canonicalizeAutoMovieJson";

/** Hash the engine's canonical JSON UTF-8 text with Node SHA-256 and return the existing lowercase sha256-prefixed digest. Hashing is independent of the engine SHA implementation while canonicalization is intentionally shared. */
export const nodeCanonicalDigest: (value: unknown) => string = (
  value: unknown,
): string =>
  `sha256:${createHash("sha256")
    .update(Buffer.from(canonicalizeAutoMovieJson(value), "utf8"))
    .digest("hex")}`;
