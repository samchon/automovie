import {
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Matrix4 } from "../../math/Matrix4";
import { setPieceTransform } from "./setPieceTransform";

/**
 * The column-major world matrix one staged set piece is drawn under.
 *
 * It composes {@link setPieceTransform}, the transform `stageScene` lowers a
 * set piece onto: translation `position`, rotation `rotation` when given and
 * otherwise a turn of `facingDeg` degrees about world +Y, `0` when that is
 * omitted too, and {@link setPieceScale}'s scale. Composed as `T · R · S` the
 * way the renderer composes it, a prop's declared boxes measured under it land
 * where the prop is drawn.
 *
 * @param piece The staged set piece.
 * @returns A new sixteen-number matrix, column-major.
 *
 * @evidence contracts/common.md#principled-implementation `Matrix4.compose` builds `T · R · S` with the `three.js` element order, over the decomposed transform `setPieceTransform` gives `stageScene`'s node, so the matrix equals the one the staged node is drawn with.
 * @evidence contracts/common.md#clear-and-simple-design One set-piece matrix shared by the prop occupancy, clearance, anchor and support-face queries, which each carried a private copy; the placement rules themselves live once in `setPieceTransform`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every piece is placed by the same precedence of rotation over facing over none; no model or prop kind is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the matrix layout, the source of each of translation, rotation and scale with their defaults and units, the composition order, and that it matches staging.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one quaternion from an angle at most and one sixteen-entry composition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one piece; each prop query composes it once per staged prop.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned matrix.
 */
export function setPieceMatrix (piece: IAutoMovieStageSetPiece): number[] {
  const transform: IAutoMovieTransform = setPieceTransform(piece);
  return Matrix4.compose(
    transform.translation,
    transform.rotation,
    transform.scale,
  );
}
