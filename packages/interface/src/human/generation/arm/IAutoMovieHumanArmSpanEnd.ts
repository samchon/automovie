import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";

/**
 * Boundary passed from one consecutive arm span to the next. Deltoid,
 * upper-arm, elbow, forearm and wrist builders share this exact row and girth
 * knot; each following span starts from the preceding result.
 */
export interface IAutoMovieHumanArmSpanEnd {
  /** Physical terminal section inherited by the next arm span. */
  row: IAutoMovieHumanArmPiece.IRow;

  /** Walk station followed by target girth, both calibration millimetres. */
  knot: [stationMillimetres: number, girthMillimetres: number];
}
