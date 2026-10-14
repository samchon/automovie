import { createHash } from "node:crypto";

/** Identify exact source bytes or the ordered layer revision declaration.
 *
 * @evidence contracts/common.md#principled-implementation Node's SHA-256 hashes the exact supplied string or byte sequence and returns lowercase hexadecimal identity.
 * @evidence contracts/common.md#clear-and-simple-design One digest helper serves exact source-byte revisions and ordered layer inventory identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hash input is caller-defined exact data, without fixture salts, fallback identities or mutation.
 * @evidence contracts/common.md#meaningful-documentation The input union and hexadecimal return expose identity representation; callers decide what bytes or structured text define equivalence.
 * @evidence contracts/performance.md#efficient-algorithms For N input bytes hashing costs O(N) with fixed hash state and a 64-character result.
 * @evidence contracts/performance.md#reuse-equivalent-work One hash instance belongs to each input; no digest cache assumes equivalence from a path alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the digest string escapes; native hash state is completed during the call and no source buffer is retained.
 */
export const digest: (bytes: Uint8Array | string) => string = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");
