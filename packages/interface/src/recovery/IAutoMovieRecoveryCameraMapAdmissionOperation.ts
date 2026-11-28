import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapInput,
} from "..";

/**
 * Callable admission contract for the ordered resident triad before feature
 * extraction and correspondence work.
 */

export namespace IAutoMovieRecoveryCameraMapAdmissionOperation {
  /**
   * Check three unique ordered views with valid raster and calibration
   * metadata, plus both seed and map policies and work ceilings. Return three
   * supplied pinhole charts in source order. Invalid input, exhausted pixel
   * limits, or unrepresentable chart arithmetic raise an error.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraMapInput,
  ) => ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[];
}
