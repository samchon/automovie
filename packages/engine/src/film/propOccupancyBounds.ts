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
 * A declared `placement.footprint` wins because it is the prop's own statement
 * of what it takes up; otherwise the bound is derived from the prop's own
 * model parts, each placed under its part transform and read through
 * `tessellate` for a primitive. Either way the volume travels through the
 * piece's full staged transform before the world bound is taken, so a rotated
 * prop widens rather than being re-fitted to its local box.
 *
 * Those parts are the prop's geometry, not necessarily what a viewer draws. A
 * prop citing an external appearance (`IAutoMoviePropSpec.modelRef`) keeps its
 * parts as the deterministic proxy the builder registered, and that proxy is
 * measured here because it is the only volume anybody stated; the imported
 * bytes are a file the engine never opens. An author whose proxy is cruder
 * than the mesh it stands for declares a `footprint` to state the use volume.
 * A prop whose parts carry no vertex at all collapses to the staged origin, so
 * a caller never has to handle an empty bound.
 *
 * @param props.prop The prop's registry entry.
 * @param props.piece The set piece that stages it.
 * @returns A new world box in metres.
 *
 * @evidence contracts/common.md#principled-implementation A declared footprint is bounded by its eight transformed corners, and the derived bound is the union of each part's exact transformed vertex box, so both are the exact axis-aligned bound of what they measure under the matrix staging draws the piece with.
 * @evidence contracts/common.md#clear-and-simple-design Piece placement is `setPieceMatrix`, the footprint transform is `transformedBoxBounds` and the part measurement is `builtPlacedPartBoxes`, the same rules buildings, clearances and staging use; this file keeps only the footprint-over-geometry precedence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No prop or model kind is special-cased; the origin collapse for a vertex-less model is the shared stated rule, and an external appearance is measured by its registered proxy for every prop alike.
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
