import type {
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryEpipolarErrorsMeasurementOperation,
  IAutoMovieRecoveryEpipolarMatrixFittingOperation,
  IAutoMovieRecoveryHomographyErrorsMeasurementOperation,
  IAutoMovieRecoveryHomographyFittingOperation,
} from "@automovie/interface";

import {
  fitRecoveryEpipolarMatrix as fitRecoveryEpipolarMatrixInternal,
  fitRecoveryHomography as fitRecoveryHomographyInternal,
  measureRecoveryEpipolarErrors as measureRecoveryEpipolarErrorsInternal,
  measureRecoveryHomographyErrors as measureRecoveryHomographyErrorsInternal,
  scoreRecoveryCameraResiduals as scoreRecoveryCameraResidualsInternal,
} from "./internal";

/** Public camera-model fitting and residual measurement operations. */
export namespace AutoMovieRecoveryCameraGeometry {
  /** Fit an epipolar matrix from paired image points. */
  export function fitEpipolarMatrix(
    ...args: Parameters<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation> {
    return fitRecoveryEpipolarMatrixInternal(...args);
  }

  /** Fit a homography from paired image points. */
  export function fitHomography(
    ...args: Parameters<IAutoMovieRecoveryHomographyFittingOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation> {
    return fitRecoveryHomographyInternal(...args);
  }

  /** Measure epipolar residuals for paired image points. */
  export function measureEpipolarErrors(
    ...args: Parameters<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> {
    return measureRecoveryEpipolarErrorsInternal(...args);
  }

  /** Measure symmetric homography transfer errors for paired image points. */
  export function measureHomographyErrors(
    ...args: Parameters<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation> {
    return measureRecoveryHomographyErrorsInternal(...args);
  }

  /** Score finite camera residuals against an inclusive pixel threshold. */
  export function scoreCameraResiduals(
    ...args: Parameters<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> {
    return scoreRecoveryCameraResidualsInternal(...args);
  }
}
