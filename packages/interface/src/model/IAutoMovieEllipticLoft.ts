import type { IAutoMovieEllipticLoftSpan } from "./IAutoMovieEllipticLoftSpan";

/**
 * Parallel elliptical sections driven by piecewise cubic Bernstein profiles.
 * The local section plane is XZ and the physical station is Y, all in metres.
 * This family assumes aligned ellipse axes and describes an open lateral
 * surface. End caps and hidden interior shape require separate observations.
 */
export interface IAutoMovieEllipticLoft {
  /**
   * Increasing, adjacent physical Y intervals; neighbours share endpoint values
   * exactly.
   */
  spans: IAutoMovieEllipticLoftSpan[];
}
