/**
 * One joint's reach over the skin.
 *
 * @evidence contracts/common.md#principled-implementation A side-neutral bone identity, axial Gaussian width and radial reach delimit one joint's procedural relief region.
 * @evidence contracts/common.md#clear-and-simple-design The per-joint region is separate from the pose model's shared response factors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same declared region convention applies to each side; no person-specific vertex list is stored.
 * @evidence contracts/common.md#meaningful-documentation Members specify bone naming and metre-valued axial and radial distances.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The joint relief region schema is a data type with no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The joint relief region schema declaration performs no request coordination or result sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The joint relief region schema owns no runtime resource acquisition or release.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinReliefJoint {
  /** The bone whose head the joint is, with each side's `left`/`right` prefix left off. */
  bone: string;

  /** Width in metres, along the bone, of the Gaussian over which the joint's skin creases. */
  sigmaMetres: number;

  /** Distance in metres from the bone's axis past which skin is another limb's. */
  reachMetres: number;
}
