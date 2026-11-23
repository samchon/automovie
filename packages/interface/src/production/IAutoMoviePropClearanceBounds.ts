import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";

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

/** Source placement inputs for a prop's declared world keep-out boxes. */
export namespace IAutoMoviePropClearanceBounds {
  /**
   * The world-axis-aligned keep-out volumes one staged prop declares, one per
   * `placement.clearance` entry in declaration order, each keeping its id.
   *
   * Each model-local box goes through the piece's full staged transform, so a
   * rotated prop's keep-out widens rather than being re-fitted. Every declared
   * box is transformed, including one whose bounds the validator rejects:
   * filtering here would hide a malformed volume from a source-side search
   * instead of letting `validatePropPlacements` name it. A prop with no
   * placement or no clearance answers an empty list.
   */
  export type IProps = {
    /**
     * Borrowed registry entry containing model-local placement.clearance boxes.
     * Missing placement or clearance yields no boxes.
     */
    prop: IAutoMoviePropSpec;
    /**
     * Borrowed staged placement for this prop. Its position, explicit rotation
     * or facingDeg, and scale transform every clearance; matching the prop node
     * is the caller's obligation.
     */
    piece: IAutoMovieStageSetPiece;
  };
}
