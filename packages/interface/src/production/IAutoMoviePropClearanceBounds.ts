import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

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

/**
 * Source placement inputs for a prop's declared world keep-out boxes.
 */
export namespace IAutoMoviePropClearanceBounds {
  /**
   * The world-axis-aligned keep-out volumes one staged prop declares, one per `placement.clearance` entry in declaration order, each keeping its id.
   *
   * Each model-local box goes through the piece's full staged transform, so a rotated prop's keep-out widens rather than being re-fitted. Every declared box is transformed, including one whose bounds the validator rejects: filtering here would hide a malformed volume from a source-side search instead of letting `validatePropPlacements` name it. A prop with no placement or no clearance answers an empty list.
   *
   * @evidence contracts/development/design.md#principled-representation Clearance input boxes are model-local metres and output boxes world-axis-aligned metres after the staged TRS; every clearance id is preserved in declaration order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface propClearanceBounds transforms declared clearance for validatePropPlacements; IAutoMoviePropBox owns the common corner shape and this result adds declaration identity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Construction transforms even malformed declared boxes so validation can report their original paths; absent clearance returns an empty array rather than a guessed occupancy margin.
   * @evidence contracts/development/common.md#meaningful-documentation Source placement inputs for a prop's declared world keep-out boxes. Clearance input boxes are model-local metres and output boxes world-axis-aligned metres after the staged TRS; every clearance id is preserved in declaration order.
   */
  export type IProps = {
    /**
     * Borrowed registry entry containing model-local placement.clearance boxes. Missing placement or clearance yields no boxes.
     */
    prop: IAutoMoviePropSpec;
    /**
     * Borrowed staged placement for this prop. Its position, explicit rotation or facingDeg, and scale transform every clearance; matching the prop node is the caller's obligation.
     */
    piece: IAutoMovieStageSetPiece;
  };
}
