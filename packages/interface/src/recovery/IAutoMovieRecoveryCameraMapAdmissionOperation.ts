import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapInput,
} from "..";

/**
 * Admit the closed three-view map and supplied charts before image allocation.
 * Pair admission retains unchanged seed semantics; third-view admission uses
 * the explicitly declared aggregate map pixel ceiling, without fitting a pair.
 */

export namespace IAutoMovieRecoveryCameraMapAdmissionOperation {
  /**
   * Admit the closed three-view map and supplied charts before image
   * allocation. Pair admission retains unchanged seed semantics; third-view
   * admission uses the explicitly declared aggregate map pixel ceiling, without
   * fitting a pair.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraMapInput,
  ) => ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[];
}
