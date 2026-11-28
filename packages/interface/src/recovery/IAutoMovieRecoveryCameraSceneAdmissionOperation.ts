import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraSceneInput,
} from "..";

/**
 * Callable preflight for a bounded ordered camera scene before feature
 * extraction.
 */

export namespace IAutoMovieRecoveryCameraSceneAdmissionOperation {
  /**
   * Admit the declared scene schema, three or more unique RGB8 views within the
   * view cap, supplied calibration, and valid seed and scene controls. Return
   * supplied pinhole charts in source order. Check separate first-two and
   * aggregate pixel limits before building charts.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraSceneInput,
  ) => ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[];
}
