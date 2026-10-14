/**
 * Numerical rest-detail filtering after skinning on one connected surface.
 *
 * This basis policy is not an anatomical document channel or a tissue law.
 * The consumer is `createHumanBodyPosedSurface`; the surface admission owns
 * its numerical bounds. Rest and posed samples use the same topology and
 * metre frame. Omission from a surface keeps its earlier deformation path.
 *
 * @evidence contracts/common.md#principled-implementation Sweep count and mask-spreading parameters configure numerical rest-detail filtering over unchanged topology.
 * @evidence contracts/common.md#clear-and-simple-design The basis policy stays separate from anatomical document channels and tissue models.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Filtering is an explicit numerical policy and does not claim an anatomical material law.
 * @evidence contracts/common.md#meaningful-documentation Members state integer counts, deficit blend range and decay bounds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The rest-detail filter policy has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The rest-detail filter policy schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rest-detail filter policy declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisSurfaceMush {
  /** Positive safe integer count of half-step, equal-neighbour Laplacian sweeps. */
  iterations: number;

  /** Largest-influence deficit at which filtering is full, in (0, 1]. */
  blendWidth: number;

  /** Nonnegative safe integer count of graph rings over which the mask spreads. */
  spreadRings: number;

  /** Fraction of a neighbouring mask carried per ring, in [0, 1). */
  spreadDecay: number;
}
