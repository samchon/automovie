import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * The world coordinates of a parallel-plane course's origin, each a source curve in the same authored station parameter, in metres.
 *
 * @evidence contracts/common.md#principled-implementation Three scalar curves, C2 in their selected interpolation parameters, locate each plane without deriving its normal from the origin's tangent. Root/angle endpoint station jets can be singular without a zero coordinate requirement.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the outline contract for each world coordinate rather than a sampled frame or a second interpolation representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are authored source inputs, never recovered from a mesh or recentered from a final section.
 * @evidence contracts/common.md#meaningful-documentation States world space, metre units and the common authored station parameter.
 */
export interface IAutoMovieConstructionParallelOrigin {
  /** World X in metres as a function of station in metres. */
  x: IAutoMovieConstructionOutline;

  /** World Y in metres as a function of the same station. */
  y: IAutoMovieConstructionOutline;

  /** World Z in metres as a function of the same station. */
  z: IAutoMovieConstructionOutline;
}
