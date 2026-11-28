import type {
  IAutoMovieRecoveryImageFit,
  IAutoMovieRecoveryImageFitPolicy,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySupportFit,
  IAutoMovieRecoverySupportFitPolicy,
} from "@automovie/interface";

import { fitRecoveryImageLoft as fitImageLoftOperation } from "./internal/fitRecoveryImageLoft";
import { fitRecoveryImageSupportLoft as fitSupportLoftOperation } from "./internal/fitRecoveryImageSupportLoft";

/** Fits measured image supports to saved lateral loft recipes. */
export namespace AutoMovieRecoveryFitting {
  /**
   * Fits the centres and radii of aligned elliptical sections from measured
   * silhouette supports.
   *
   * Supply at least three calibrated views with separated squared support
   * directions and a common measured height interval. The policy supplies
   * finite positive pixel tolerance, rank thresholds in (0, 1), and positive
   * safe-integer view, row and span limits. The first qualifying cubic spline
   * is saved in metres.
   *
   * A successful fit is partial. It infers an open lateral surface within the
   * measured interval under the ellipse prior. Caps and interior remain
   * unobserved. Admission or exhausted fitting returns a refusal. A
   * cancellation request or callback failure has its own terminal status.
   */
  export function fitImageLoft(
    observation: IAutoMovieRecoveryImageObservation,
    policy: IAutoMovieRecoveryImageFitPolicy,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageFit> {
    return fitImageLoftOperation(observation, policy, options);
  }

  /**
   * Fits continuous convex support profiles from calibrated image envelopes.
   *
   * Each view contributes two oriented supports across the common measured
   * height interval. The policy supplies view, row and span budgets, a finite
   * positive pixel tolerance and a spline-rank threshold in (0, 1). The
   * accepted spline and its induced polygon satisfy the observed supports.
   * Engine generation controls qualify the resulting boundary changes.
   *
   * Success returns a partial saved loft in metres. Hidden concavity, caps and
   * interior remain unresolved, and enclosure depends on segmentation and
   * camera calibration. Invalid or exhausted fits refuse with diagnostics.
   * Cancellation and callback failure preserve their own terminal statuses.
   */
  export function fitSupportLoft(
    observation: IAutoMovieRecoveryImageObservation,
    policy: IAutoMovieRecoverySupportFitPolicy,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportFit> {
    return fitSupportLoftOperation(observation, policy, options);
  }
}
