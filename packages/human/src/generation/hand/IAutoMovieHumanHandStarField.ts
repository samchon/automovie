import type { AutoMovieNaturalSpline } from "@automovie/engine";

/**
 * A star read at any station: the natural splines, along the hand, of the
 * inner point's `[b, c]`, the half extents and the harmonics of the skin's
 * radius about that point (`AutoMovieHumanArmPrior.IStar`).
 */
export interface IAutoMovieHumanHandStarField {
  /** Stations `a` along the hand the series were read at, increasing, mm of the form. */
  stations: readonly number[];

  /** One natural spline per series column, over the stations. */
  splines: AutoMovieNaturalSpline.ISpline[];
}
