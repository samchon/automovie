import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A suggested topple: the support hull edge the object tips over (the pivot
 * axis) and the horizontal direction it falls, when its center of mass
 * overhangs the support.
 *
 * @author Samchon
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
