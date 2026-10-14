/**
 * Requires the existing UUIDv4 spelling and returns it unchanged or throws the labelled identity refusal.
 *
 * @evidence contracts/common.md#principled-implementation Requires the existing UUIDv4 spelling and returns it unchanged or throws the labelled identity refusal.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The returned string is metadata only and acquires no reservation.
 * @evidence contracts/performance.md#efficient-algorithms Regex work scales with supplied text; it validates format rather than global uniqueness.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string is metadata only and acquires no reservation.
 */
export const repaintExecutionUuid: (value: string, label: string) => string = (value: string, label: string): string => {
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      value,
    ) === false
  )
    throw new Error(`Repaint ${label} must be a UUID v4.`);
  return value;
};
