import { IAutoMoviePlanarPoint, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One closed ring of a footprint, with the plan projection and the signed area
 * the queries read.
 *
 * The planar copy is kept rather than derived per call: `spaceGround` is asked
 * per foot per frame, and mapping `(x, z)` to `(x, y)` inside that loop would
 * build one array per containment test.
 *
 * @evidence contracts/development/design.md#principled-representation footprintRing retains authored world vertices, copies their XZ projection and sums oriented shoelace cross products; binary64 cancellation can affect signed area for large translations or very small regions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source points, planar predicate input and cached area stay in one ring so repeated space queries need no projection allocation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ring preserves authored order and concavity without hull replacement; it performs no topology validation or automatic winding repair.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes borrowed world points from fresh planar coordinates and twice-signed area; zero area is a degenerate or cancelling calculation, not proof of collinearity for arbitrary rings.
 */
export interface IAutoMovieFootprintRing {
  /** Borrowed authored world vertices; X and Z define the plan, while Y remains available to consumers. */
  readonly points: readonly IAutoMovieVector3[];

  /** The same ring as `(x, y) = (x, z)`, for the planar predicates. */
  readonly plan: readonly IAutoMoviePlanarPoint[];

  /**
   * Twice the oriented shoelace area of the prepared plan, in square metres.
   * Valid simple rings use its magnitude; zero also occurs for cancelling invalid rings.
   */
  readonly doubleArea: number;
}
