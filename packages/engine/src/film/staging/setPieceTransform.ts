import {
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { setPieceScale } from "./setPieceScale";

/** World up, the axis `facingDeg` turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * The world transform a staged set piece's node carries.
 *
 * Translation is `position`. Rotation is the authored unit `rotation` when
 * present, else a turn of `facingDeg` degrees about world up, `0` facing `+Z`
 * when that is omitted too. Scale is {@link setPieceScale}'s reading of the
 * optional size multiplier. `stageScene` refuses a piece that states both
 * `rotation` and `facingDeg`, so the precedence only decides input that
 * reaches this helper unvalidated.
 *
 * @param piece The staged set piece.
 * @returns A transform that shares `position`, an authored `rotation` and a
 *   vector `scale` with the piece rather than copying them.
 *
 * @evidence contracts/common.md#principled-implementation Reads the three authored spellings into the decomposed TRS the scene node stores, using the shared quaternion axis-angle construction for the yaw-only spelling, so every consumer composes `T · R · S` from one reading.
 * @evidence contracts/common.md#clear-and-simple-design The one place a set piece's rotation and scale defaults are decided; `stageScene` writes it onto the node and `setPieceMatrix` composes the matrix every prop query measures under from it, instead of each restating the fallback chain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No piece or model is special-cased; the `+Z`-facing default is the staging contract's meaning of an omitted turn.
 * @evidence contracts/common.md#meaningful-documentation States each component's source and default, the unit and axis of `facingDeg`, the precedence and who validates it, and what the result aliases.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work: at most one axis-angle quaternion and one scale vector.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads one piece per call and coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the result references the piece's own `position`, `rotation` and vector `scale` objects, so a caller that mutates the result mutates the piece.
 */
export const setPieceTransform = (
  piece: IAutoMovieStageSetPiece,
): IAutoMovieTransform => ({
  translation: piece.position,
  rotation:
    piece.rotation ?? Quaternion.fromAxisAngle(UP, piece.facingDeg ?? 0),
  scale: setPieceScale(piece.scale),
});
