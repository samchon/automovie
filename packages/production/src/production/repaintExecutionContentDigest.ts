import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Requires canonical SHA256 digest spelling and returns it unchanged or throws the labelled identity refusal.
 *
 * @evidence contracts/common.md#principled-implementation Requires canonical SHA256 digest spelling and returns it unchanged or throws the labelled identity refusal.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation No buffer, file or digest cache is retained.
 * @evidence contracts/performance.md#efficient-algorithms Regex checks metadata format without hashing bytes or proving byte correspondence.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No buffer, file or digest cache is retained.
 */
export const repaintExecutionContentDigest: (value: string, label: string) => string = (value: string, label: string): string => {
  if (SHA256_DIGEST_PATTERN.test(value) === false)
    throw new Error(`Repaint ${label} must be a canonical sha256 digest.`);
  return value;
};
