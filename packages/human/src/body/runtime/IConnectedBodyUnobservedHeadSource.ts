import type { IAutoMovieHumanBodyHumeralHead } from "../anatomy/shoulder/IAutoMovieHumanBodyHumeralHead";

/**
 * The source label for a head radius without an observed acquisition record. Prior, target and measured labels remain distinct, but none gains imaging posture or source provenance merely by being packed into a preview.
 *
 * @evidence contracts/common.md#principled-implementation Excluding observed from the producer's closed source union reserves acquisition metadata for the observed branch of ConnectedBodyHumeralHeadReading.
 * @evidence contracts/common.md#clear-and-simple-design The schema reuses the radius owner's source labels instead of defining a parallel provenance taxonomy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-observed radius cannot acquire invented tomographic metadata through this transport branch.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes source labels from actual acquisition records and their preview handling.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This source-label interface performs no radius inference.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration has no observation cache or request coordination.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased source record owns no acquisition or image resource.
 *
 * @author Samchon
 */
export interface IConnectedBodyUnobservedHeadSource {
  /** Any head source other than an observed acquisition. */
  source: Exclude<IAutoMovieHumanBodyHumeralHead["source"], "observed">;
}
