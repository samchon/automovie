import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraSceneInput,
} from "../../index";

/** Admit a closed bounded calibrated image set before observing any raster. */

export namespace IAutoMovieRecoveryCameraSceneAdmissionOperation {
  /** Admit a closed bounded calibrated image set before observing any raster. */

  export type Operation = (
    input: IAutoMovieRecoveryCameraSceneInput,
  ) => ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[];
}
