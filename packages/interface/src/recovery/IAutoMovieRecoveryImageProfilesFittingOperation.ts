import type { IAutoMovieEllipticLoft } from "..";

/**
 * Fit the four scalar profiles of an aligned elliptical section family.
 */

export namespace IAutoMovieRecoveryImageProfilesFittingOperation {
  /**
   * Fit a shared cubic spline to the supplied millimetre samples. Supply a
   * positive safe integer span count and a finite minimum rank ratio strictly
   * between zero and one. The first and last stations define the fit interval,
   * and at least spans + 3 samples are required. Return Bernstein loft
   * coefficients and intervals in metres. Any nonpositive radius control
   * refuses the fit.
   */

  export type Operation = (
    samples: readonly {
      /** Finite physical Y in the admitted fit interval, in millimetres. */
      yMm: number;
      /** Radius X, radius Z, center X and center Z, in millimetres. */
      values: [number, number, number, number];
    }[],
    spans: number,
    minimumRankRatio: number,
  ) => {
    /** Fitted vertical intervals and cubic elliptic profiles, in metres. */
    loft: IAutoMovieEllipticLoft;
    /** Minimum divided by maximum absolute original-design QR diagonal. */
    rankRatio: number;
  };
}
