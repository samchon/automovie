import { createHash } from "node:crypto";

/**
 * Return a stable SHA-256 content digest.
 *
 * @evidence contracts/common.md#principled-implementation Node SHA-256 consumes the supplied byte view directly and produces a lowercase sha256-prefixed hexadecimal digest.
 * @evidence contracts/common.md#clear-and-simple-design This Node hashing owner serves canonical values, source identities and publication bytes without interpreting their domains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No implicit text decoding, framing or normalization occurs; the caller owns stable bytes and domain composition.
 * @evidence contracts/common.md#meaningful-documentation States the exact byte domain and prefixed digest spelling rather than promising collision-free identity.
 * @evidence contracts/performance.md#efficient-algorithms Hashing B bytes costs O(B) time with fixed hash state and a fixed-size result; the byte view is not copied here.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers pass already acquired byte arrays directly; this function caches no digest across mutable buffers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The hash finalizes before return; only the digest string escapes and no file or task is acquired.
 */
export const digestAutoMovieBytes: (bytes: Uint8Array) => string = (bytes: Uint8Array): string => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
