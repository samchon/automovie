import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Recognize the shared lowercase sha256-prefixed digest spelling for lane metadata. This runtime syntax guard does not hash or prove any artifact's bytes.
 *
 * @evidence contracts/common.md#principled-implementation The engine-owned SHA-256 digest pattern supplies the same spelling boundary as receipt and output owners.
 * @evidence contracts/common.md#clear-and-simple-design The lane adapter depends on the shared digest syntax rather than a copied regular expression.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching text supplies no artifact existence, collision-free identity or completed review proof.
 * @evidence contracts/common.md#meaningful-documentation Prose states runtime syntax-only admission and the absence of hashing.
 * @evidence contracts/performance.md#efficient-algorithms The fixed anchored pattern checks supplied text without byte buffers or a metadata traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar syntax test coordinates no requests or digest result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shared pattern is module-owned and no caller text or artifact handle is retained; only a boolean escapes.
 */
export const productionRepaintLaneIsDigest: (value: string) => boolean = (value: string): boolean =>
  SHA256_DIGEST_PATTERN.test(value);
