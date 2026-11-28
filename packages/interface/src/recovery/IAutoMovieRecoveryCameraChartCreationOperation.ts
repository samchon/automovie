import type { IAutoMovieRecoveryCameraPairInput } from "..";

/** Callable construction of a supplied pinhole chart and its analytic inverse. */

export namespace IAutoMovieRecoveryCameraChartCreationOperation {
  /**
   * Form the row-major pinhole matrix from the given focal lengths, skew and
   * principal point. Test round trips on independent pixel steps and image
   * bounds. Nonrepresentable calibration or lost increments raise an error.
   */

  export type Operation = (
    view: IAutoMovieRecoveryCameraPairInput["views"][number],
  ) => {
    /**
     * Row-major 3 by 3 pinhole matrix mapping normalized camera coordinates to
     * resident pixel-center coordinates.
     */
    matrix: number[];
    /**
     * Analytic row-major inverse mapping homogeneous resident pixel centers to
     * calibrated camera rays.
     */
    inverse: number[];
  };
}
