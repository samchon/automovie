import type { IAutoMovieRecoveryEventCurveArc } from "..";

/** Four oriented cubic boundary paths and optional periodic seam identification. */
export interface IAutoMovieRecoveryEventChart {
  /** Boundary at v=0, traversed from u=0 to u=1. */
  bottom: IAutoMovieRecoveryEventCurveArc;

  /** Boundary at v=1, traversed from u=0 to u=1. */
  top: IAutoMovieRecoveryEventCurveArc;

  /** Boundary at u=0, traversed from v=0 to v=1. */
  left: IAutoMovieRecoveryEventCurveArc;

  /** Boundary at u=1, traversed from v=0 to v=1. */
  right: IAutoMovieRecoveryEventCurveArc;

  /** True identifies left and right as the two periodic seam occurrences. */
  periodic?: boolean;
}
