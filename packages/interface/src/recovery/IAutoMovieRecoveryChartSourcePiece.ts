import type { IAutoMovieRecoveryEventCurveSource } from "..";

/** Native boundary provenance for one generated tensor cell. */

export interface IAutoMovieRecoveryChartSourcePiece {
  /** Generated patch identity within the compiled chart. */
  patch: string;

  /** Native local interval [u0,u1,v0,v1]. */
  chart: [number, number, number, number];

  /**
   * Bottom, right, top and left native intervals with declared coefficient
   * authority.
   */
  boundaryCoefficientSources: IAutoMovieRecoveryEventCurveSource[];
}
