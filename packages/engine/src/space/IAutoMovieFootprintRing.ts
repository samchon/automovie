import { IAutoMoviePlanarPoint, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One closed ring of a footprint, with the plan projection and the signed area
 * the queries read.
 *
 * The planar copy is kept rather than derived per call: `spaceGround` is asked
 * per foot per frame, and mapping `(x, z)` to `(x, y)` inside that loop would
 * build one array per containment test.
 *
 * @evidence contracts/common.md#principled-implementation footprintRing retains authored world vertices, copies their XZ projection and sums oriented shoelace cross products; binary64 cancellation can affect signed area for large translations or very small regions.
 * @evidence contracts/common.md#clear-and-simple-design Source points, planar predicate input and cached area stay in one ring so repeated space queries need no projection allocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ring preserves authored order and concavity without hull replacement; it performs no topology validation or automatic winding repair.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes borrowed world points from fresh planar coordinates and twice-signed area; zero area is a degenerate or cancelling calculation, not proof of collinearity for arbitrary rings.
 * @evidence contracts/performance.md#efficient-algorithms Preparing E vertices takes O(E) time and fresh planar storage; subsequent boundary/parity queries remain O(E), while the stored area is read in constant time.
 * @evidence contracts/performance.md#reuse-equivalent-work The planar copy and area are reused across queries; mutation of borrowed source vertices invalidates both and requires a fresh preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The prepared ring owns its planar array and retains the authored point array; readonly is a caller discipline, with no watcher or invalidation task retained.
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
