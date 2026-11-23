import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
  IAutoMovieRecoveryImageFeaturesMatchingOperation,
} from "../../index";

/**
 * Qualify completed automatic observations and assemble owned camera evidence.
 * Every independent final gate runs when its required observations exist. A
 * completed observation artifact may refuse its camera; only a candidate
 * passing all gates exposes a relative transform. No shape reconstruction is
 * performed.
 */

export namespace IAutoMovieRecoveryCameraEstimateCreationOperation {
  /**
   * Qualify completed automatic observations and assemble owned camera
   * evidence. Every independent final gate runs when its required observations
   * exist. A completed observation artifact may refuse its camera; only a
   * candidate passing all gates exposes a relative transform. No shape
   * reconstruction is performed.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraPairInput,
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    matches: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>,
    charts: [
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    ],
    checkpoint: (phase: string, completed: number, total: number) => void,
  ) => IAutoMovieRecoveryCameraPairEstimate;
}
