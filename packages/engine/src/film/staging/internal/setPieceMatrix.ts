import {
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Matrix4 } from "../../../math/Matrix4";
import { setPieceTransform } from "./setPieceTransform";

/*
 * The column-major world matrix one staged set piece is drawn under.
 *
 * It composes setPieceTransform, the transform `stageScene` lowers a set
 * piece onto: translation `position`, rotation `rotation` when given and
 * otherwise a turn of `facingDeg` degrees about world +Y, `0` when that is
 * omitted too, and setPieceScale's scale. Composed as `T · R · S` the
 * way the renderer composes it, a prop's declared boxes measured under it land
 * where the prop is drawn.
 * Parameter piece: The staged set piece.
 * Returns: A new sixteen-number matrix, column-major.
 */
export function setPieceMatrix(piece: IAutoMovieStageSetPiece): number[] {
  const transform: IAutoMovieTransform = setPieceTransform(piece);
  return Matrix4.compose(
    transform.translation,
    transform.rotation,
    transform.scale,
  );
}
