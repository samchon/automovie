/**
 * Distinguishes native reference posture from explicitly diagnostic reposing.
 * Diagnostic sections carry no implied unfolded-tissue anatomical validity.
 *
 * @evidence contracts/common.md#principled-implementation A closed posture union prevents diagnostic observations from being silently labelled native measurements.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the observation's posture; registration remains the producer's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Embeds no identity-specific geometry or claimed tissue conversion.
 * @evidence contracts/common.md#meaningful-documentation States the distinction and the anatomical qualification limit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A string union selects no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A string union coordinates no execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A string union owns no runtime resources.
 */
export type Pose = "native-A" | "diagnostic-T";
