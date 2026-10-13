import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Strings must match the engine's shared SHA256_DIGEST_PATTERN.
 *
 * @evidence contracts/common.md#principled-implementation Strings must match the engine's shared SHA256_DIGEST_PATTERN.
 * @evidence contracts/common.md#clear-and-simple-design Index digest fields share their producers' lowercase prefixed spelling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Format narrowing does not authenticate bytes or truth of the recorded digest.
 * @evidence contracts/common.md#meaningful-documentation States anchored format-only admission and separate identity comparisons.
 * @evidence contracts/performance.md#efficient-algorithms The fixed digest pattern inspects supplied text without hashing bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the engine pattern without retaining matched values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no buffer or handle is acquired.
 */
export const libraryStateIsDigest: (value: unknown) => value is string = (value: unknown): value is string => typeof value === "string" && SHA256_DIGEST_PATTERN.test(value);
