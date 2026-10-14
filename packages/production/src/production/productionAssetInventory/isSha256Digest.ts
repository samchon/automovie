import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Check the shared canonical lowercase SHA-256 text spelling.
 *
 * @evidence contracts/common.md#principled-implementation Uses SHA256_DIGEST_PATTERN supplied by the engine's canonical digest grammar.
 * @evidence contracts/common.md#clear-and-simple-design The owning shared pattern avoids another local digest regular expression.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Spelling alone does not establish current-byte equality, authenticity or impossible hash collisions; actual byte hashing remains inventory work.
 * @evidence contracts/common.md#meaningful-documentation Documents grammar-only acceptance and separate digest authority.
 * @evidence contracts/performance.md#efficient-algorithms The fixed-format regular expression checks supplied text; accepted digest length is bounded by the shared grammar.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares immutable grammar, not an input-specific validity cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No hash context, buffer or resource is acquired by this predicate.
 *
 * @author Samchon
 */
export function isSha256Digest(value: string): boolean { return SHA256_DIGEST_PATTERN.test(value); }
