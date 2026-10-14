import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Admit the shared SHA-256 digest spelling in observation metadata without hashing a review artifact or member set.
 *
 * @evidence contracts/common.md#principled-implementation The engine-owned anchored digest pattern defines the same lowercase sha256-prefixed identity spelling used by source and receipt owners.
 * @evidence contracts/common.md#clear-and-simple-design Observation metadata reuses shared syntax while actual member hashing and artifact reading keep their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Syntactically valid digest text does not prove artifact existence, observation completion or collision-free identity.
 * @evidence contracts/common.md#meaningful-documentation Prose states metadata syntax admission and the absence of physical hashing.
 * @evidence contracts/performance.md#efficient-algorithms One fixed anchored pattern check uses no metadata population or media buffers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar predicate owns no observation request or digest cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shared pattern state is module-owned; caller text, artifact bytes and playback resources are not retained.
 */
export const productionRepaintObservationIsDigest: (value: string) => boolean = (value: string): boolean =>
  SHA256_DIGEST_PATTERN.test(value);
