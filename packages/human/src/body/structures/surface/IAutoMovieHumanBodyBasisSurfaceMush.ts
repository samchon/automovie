/**
 * Numerical rest-detail filtering after skinning on one connected surface.
 *
 * This basis policy is not an anatomical document channel or a tissue law.
 * The consumer is `createHumanBodyPosedSurface`; the surface admission owns
 * its numerical bounds. Rest and posed samples use the same topology and
 * metre frame. Omission from a surface keeps its earlier deformation path.
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
