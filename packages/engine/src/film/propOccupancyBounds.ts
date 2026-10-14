import {
  IAutoMoviePropBox,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";

import { builtPlacedPartBoxes } from "../architecture/builtPlacedPartBoxes";
import { transformedBoxBounds } from "../math/transformedBoxBounds";
import { setPieceMatrix } from "./staging/setPieceMatrix";
import { unionSubjectBoxes } from "./unionSubjectBoxes";

/**
 * The world-axis-aligned volume one staged prop occupies.
 *
 * A declared `placement.footprint` wins because it is the prop's own statement of what it takes up; otherwise the bound is derived from the prop's own model parts, each placed under its part transform and read through `tessellate` for a primitive. Either way the volume travels through the piece's full staged transform before the world bound is taken, so a rotated prop widens rather than being re-fitted to its local box.
 *
 * Those parts are the prop's geometry, not necessarily what a viewer draws. A prop citing an external appearance keeps its registered deterministic proxy; this engine query does not open imported asset bytes. An explicit footprint states the use volume when the proxy is too crude. If no part carries a vertex, builtPlacedPartBoxes returns a zero box at the staged piece's world origin.
 *
 * @param props.prop The prop's registry entry.
 * @param props.piece The set piece that stages it.
 * @returns A new world box in metres.
 *
 * @evidence contracts/common.md#principled-implementation Bounds a declared footprint by eight transformed corners or unions measured part-vertex boxes under staged placement. The shared builtPlacedPartBoxes empty-vertex fallback is a zero box at Matrix4.position of that placement, preserving the staged node's origin while representing no occupied extent.
 * @evidence contracts/common.md#clear-and-simple-design Piece placement is `setPieceMatrix`, the footprint transform is `transformedBoxBounds` and the part measurement is `builtPlacedPartBoxes`, the same rules buildings, clearances and staging use; this file keeps only the footprint-over-geometry precedence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No prop or model kind is special-cased; a vertexless model uses the shared staged-origin zero-box fallback, and external appearance is measured by its registered proxy rather than guessed from unavailable bytes.
 * @evidence contracts/common.md#meaningful-documentation States the footprint precedence and why, how parts are measured, that rotation widens the box, what is measured for an external appearance and the remedy when the proxy is crude, the origin collapse, and the frame and unit.
 * @evidence contracts/performance.md#efficient-algorithms Constant time for a footprint; otherwise linear in the model's summed vertex count, folded per part without materializing a world point array.
 * @evidence contracts/performance.md#reuse-equivalent-work The staged matrix is composed once per call and reused for every part; tessellation is not cached across calls because the prop record is the caller's mutable data.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps the per-part boxes only until they are unioned and retains nothing; the caller owns the returned box.
 */
export function propOccupancyBounds (props: {
  prop: IAutoMoviePropSpec;
  piece: IAutoMovieStageSetPiece;
}): IAutoMoviePropBox {
  const matrix: number[] = setPieceMatrix(props.piece);
  const footprint: IAutoMoviePropBox | null =
    props.prop.placement?.footprint ?? null;
  if (footprint !== null) return transformedBoxBounds(footprint, matrix);
  return unionSubjectBoxes(builtPlacedPartBoxes(props.prop.model, matrix))!;
}
