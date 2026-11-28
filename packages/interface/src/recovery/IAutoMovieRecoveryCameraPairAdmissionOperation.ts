import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairInput,
} from "..";

/** Callable preflight for an ordered calibrated resident camera pair. */

export namespace IAutoMovieRecoveryCameraPairAdmissionOperation {
  /**
   * Admit exactly two fixed RGB8 views with unique IDs, valid source and chart
   * metadata, and the supplied seed policy and work limits. Check the pair's
   * aggregate pixel cap and return its ordered supplied intrinsic charts and
   * admitted pixel count. Invalid metadata, controls or chart arithmetic raise
   * before feature extraction.
   */

  export type Operation = (input: IAutoMovieRecoveryCameraPairInput) => {
    /**
     * Two admitted pinhole matrices and analytic inverses in original pair
     * order.
     */
    charts: [
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    ];

    /** Total original pixel count admitted for the two resident rasters. */
    pixels: number;
  };
}
