import { IAutoMoviePropBox, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One prop clearance box carried into world space, still carrying the id that
 * declared it.
 *
 * `propClearanceBounds` produces one per `placement.clearance` entry, in
 * declaration order, by transforming the eight corners of the model-space box
 * through the staged piece's position, rotation (or `facingDeg` about `+Y`) and
 * scale, and taking their world-axis-aligned bounds. `validatePropPlacements`
 * reports a clearance that overlaps another staged prop's occupancy, and skips
 * an entry whose authored box is not finite, which it refuses separately.
 *
 * @evidence contracts/development/design.md#principled-representation The world bounds of a transformed box are the per-axis extremes of its eight transformed corners, which is exact for an affine map and encloses a rotated box conservatively; an entry whose authored box is malformed is still transformed, so its index stays aligned with `placement.clearance` and the validator names the authored entry instead of a filtered list hiding it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the shared `IAutoMoviePropBox` with only the `id`, because the overlap test reads the box and the diagnostic needs the clearance name; `min` and `max` are restated here only to document that this box is in world space.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop, clearance id or axis is special-cased: every entry goes through the same staged transform the occupancy box uses, and a rotated box is widened to its world bounds rather than tested in its own frame by a separate path.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and its order, the transform and its rotation fallback, the conservative world bounds, the consumer and how it treats a malformed entry, and that both corners are world metres.
 */
export interface IAutoMoviePropClearanceBounds extends IAutoMoviePropBox {
  /** Id of the `placement.clearance` entry this box came from. */
  id: string;

  /** Minimum world corner in metres, after the staged transform. */
  min: IAutoMovieVector3;

  /**
   * Maximum world corner in metres, after the staged transform; not below `min`
   * on any axis unless a corner is `NaN`.
   */
  max: IAutoMovieVector3;
}
