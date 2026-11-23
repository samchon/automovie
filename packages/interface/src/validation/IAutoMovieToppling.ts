import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Nearest support-hull pivot and horizontal fall direction suggested for an
 * overhang.
 */
export interface IAutoMovieToppling {
  /** One end of the pivot edge (the nearest support hull edge). */
  tipEdgeStart: IAutoMovieVector3;

  /** The other end of the pivot edge. */
  tipEdgeEnd: IAutoMovieVector3;

  /** Unit horizontal direction (XZ, y=0) the object falls toward. */
  fallDirection: IAutoMovieVector3;

  /** How far past the margin the COM overhangs, in meters. */
  overshoot: number;
}
