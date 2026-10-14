/**
 * The straight distance between two shaped landmarks.
 *
 * @evidence contracts/common.md#principled-implementation The distance discriminator selects a straight length between two named shaped landmarks.
 * @evidence contracts/common.md#clear-and-simple-design The rule holds endpoint identities without copying their coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Landmark identities come from the basis rather than a fixture-specific point.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes straight landmark distance from section girth.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The landmark distance rules declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The landmark distance rules schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The landmark distance rules type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyLandmarkDistance {
  /** A straight landmark-to-landmark length. */
  kind: "distance";

  /** Landmark id at one end. */
  from: string;

  /** Landmark id at the other end. */
  to: string;
}
