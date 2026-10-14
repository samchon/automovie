import {
  IAutoMovieClearanceBox,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";

import { transformedBoxBounds } from "../math/transformedBoxBounds";
import { IAutoMoviePropClearanceBounds } from "./IAutoMoviePropClearanceBounds";
import { setPieceMatrix } from "./staging/setPieceMatrix";

/**
 * The world-axis-aligned keep-out volumes one staged prop declares, one per `placement.clearance` entry in declaration order, each keeping its id.
 *
 * Each model-local box goes through the piece's full staged transform, so a rotated prop's keep-out widens rather than being re-fitted. Every declared box is transformed, including one whose bounds the validator rejects: filtering here would hide a malformed volume from a source-side search instead of letting `validatePropPlacements` name it. A prop with no placement or no clearance answers an empty list.
 *
 * @param props.prop The prop's registry entry.
 * @param props.piece The set piece that stages it.
 * @returns New world boxes in metres, one per declared clearance.
 *
 * @evidence contracts/common.md#principled-implementation Composes the staged matrix once and bounds each affine box image through its eight corners using transformedBoxBounds. This is the exact-real axis-aligned bound of that image; binary64 products and sums can round or overflow, and malformed boxes are intentionally not admitted here. setPieceMatrix supplies the same TRS convention as staging without observing renderer pixels.
 * @evidence contracts/common.md#clear-and-simple-design Placement and the box transform are the shared `setPieceMatrix` and `transformedBoxBounds`, so occupancy and clearance are measured under one rule and this file only pairs each box with its id.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No prop or clearance kind is special-cased, and a malformed box is transformed like any other so the validator, not this query, decides its fate.
 * @evidence contracts/common.md#meaningful-documentation States the order and the id carried, that rotation widens the box, why malformed boxes are kept, the empty answer, and the frame and unit of the result.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the declared clearance count, with one matrix composition for the piece and a constant eight-corner fold per box.
 * @evidence contracts/performance.md#reuse-equivalent-work The staged matrix is composed once and reused for every clearance box of the prop instead of once per box.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned boxes, one per declared clearance.
 */
export function propClearanceBounds(props: {
  prop: IAutoMoviePropSpec;
  piece: IAutoMovieStageSetPiece;
}): IAutoMoviePropClearanceBounds[] {
  const matrix: number[] = setPieceMatrix(props.piece);
  return (props.prop.placement?.clearance ?? []).map(
    (clearance: IAutoMovieClearanceBox): IAutoMoviePropClearanceBounds => ({
      id: clearance.id,
      ...transformedBoxBounds(clearance, matrix),
    }),
  );
}
