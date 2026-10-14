/**
 * The ids of one landmark's left and right instances.
 *
 * @evidence contracts/common.md#principled-implementation Explicit left and right names distinguish the two instances of one basis landmark.
 * @evidence contracts/common.md#clear-and-simple-design A paired record keeps side identity visible at each access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither side is inferred from array position or a mirrored numerical coordinate.
 * @evidence contracts/common.md#meaningful-documentation Each property states which anatomical side its name addresses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The paired landmark identities declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The paired landmark identities schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The paired landmark identities type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyPairedLandmarks {
  /** The body's left instance. */
  left: string;

  /** The body's right instance. */
  right: string;
}
