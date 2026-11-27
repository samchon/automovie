import {
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../../math/Quaternion";
import { setPieceScale } from "./setPieceScale";

/**
 * The world transform a staged set piece's node carries.
 *
 * Translation is `position`. Rotation is the authored unit `rotation` when
 * present, else a turn of `facingDeg` degrees about world up, `0` facing `+Z`
 * when that is omitted too. Scale is {@link setPieceScale}'s reading of the
 * optional size multiplier. `stageScene` refuses a piece that states both
 * `rotation` and `facingDeg`, so the precedence only decides input that reaches
 * this helper unvalidated.
 *
 * @param piece The staged set piece.
 * @returns A transform that shares `position`, an authored `rotation` and a
 *   vector `scale` with the piece rather than copying them.
 */
export function setPieceTransform(
  piece: IAutoMovieStageSetPiece,
): IAutoMovieTransform {
  return {
    translation: piece.position,
    rotation:
      piece.rotation ?? Quaternion.fromAxisAngle(UP, piece.facingDeg ?? 0),
    scale: setPieceScale(piece.scale),
  };
}

/** World up, the axis `facingDeg` turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
