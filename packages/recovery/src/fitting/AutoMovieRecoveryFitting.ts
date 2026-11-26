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
  fitAutoMovieRecoveryImageLoft as fitImageLoftOperation,
} from "./internal/fitAutoMovieRecoveryImageLoft";
import {
  fitAutoMovieRecoveryImageSupportLoft as fitSupportLoftOperation,
} from "./internal/fitAutoMovieRecoveryImageSupportLoft";

/** Fit image observations into the package's supported Recovery loft families. */
export namespace AutoMovieRecoveryFitting {
  /** Fit calibrated silhouette supports under the aligned ellipse prior. */
  export function fitImageLoft(
    observation: IAutoMovieRecoveryImageObservation,
    policy: IAutoMovieRecoveryImageFitPolicy,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageFit> {
    return fitImageLoftOperation(observation, policy, options);
  }

  /** Fit finite-view convex support profiles under supplied-camera bounds. */
  export function fitSupportLoft(
    observation: IAutoMovieRecoveryImageObservation,
    policy: IAutoMovieRecoverySupportFitPolicy,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportFit> {
    return fitSupportLoftOperation(observation, policy, options);
  }
}