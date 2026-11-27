import type {
  IAutoMovieRecoveryImageFit,
  IAutoMovieRecoveryImageFitPolicy,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySupportFit,
  IAutoMovieRecoverySupportFitPolicy,
} from "@automovie/interface";

import {
  fitRecoveryImageLoft as fitImageLoftOperation,
} from "./internal/fitRecoveryImageLoft";
import {
  fitRecoveryImageSupportLoft as fitSupportLoftOperation,
} from "./internal/fitRecoveryImageSupportLoft";

/** Fit image observations into the package's supported Recovery loft families. */
export namespace AutoMovieRecoveryFitting {
  /**
   * Infer aligned elliptical sections from calibrated horizontal silhouette
   * supports. At each common physical Y, midpoint = cos(a) centreX + sin(a)
   * centreZ and halfWidth squared = cos(a) squared radiusX squared + sin(a)
   * squared radiusZ squared. These are support-function constraints; matching the
   * left or right contour across views as a material point would be incorrect.
   * Three distinct squared support directions permit an overdetermined family
   * check. Passed checks remain conditional on the stated ellipse prior and
   * supplied rigid camera calibration. Different row charts use piecewise linear
   * interpolation only within their common measured interval. No endpoint
   * extrapolation, inferred cap or unseen concavity is generated. Increasing
   * uniform cubic spline spaces are tried in order until every compared support
   * meets the pixel budget or maxSpans is exhausted.
   */
  export function fitImageLoft(
    observation: IAutoMovieRecoveryImageObservation,
    policy: IAutoMovieRecoveryImageFitPolicy,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageFit> {
    return fitImageLoftOperation(observation, policy, options);
  }

  /**
   * Fit compact continuous support profiles from supplied-camera image envelopes.
   * Every view supplies two oriented inequalities, not a corresponding material
   * contour. Increasing common cubic spaces are tried in order. Both offset fits
   * and the implied polygon's supports must meet every common-domain observation;
   * engine admission qualifies feasible active-boundary changes before transfer.
   * The finite-view section hull cannot identify hidden concavity or interior.
   * Segmentation/calibration uncertainty prevents a certified true enclosure.
   */
  export function fitSupportLoft(
    observation: IAutoMovieRecoveryImageObservation,
    policy: IAutoMovieRecoverySupportFitPolicy,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportFit> {
    return fitSupportLoftOperation(observation, policy, options);
  }
}