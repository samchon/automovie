import type { IAutoMovieRecoveryCameraPairInput } from "..";

/**
 * Callable observation of one admitted RGB8 chart as localized features and
 * gradient descriptors.
 */

export namespace IAutoMovieRecoveryImageFeaturesExtractionOperation {
  /**
   * Build Gaussian pyramid levels from the stable raster. Localize interior
   * Harris maxima, require orientation and a supported descriptor window, and
   * apply adaptive spatial suppression. Return normalized descriptors and
   * original-chart feature positions, with separate detector and rejection
   * counts.
   */

  export type Operation = (
    view: IAutoMovieRecoveryCameraPairInput["views"][number],
    policy: IAutoMovieRecoveryCameraPairInput["policy"],
    budget: IAutoMovieRecoveryCameraPairInput["budget"],
  ) => {
    /**
     * Retained features in deterministic spatial-selection order, with owned
     * descriptor arrays.
     */
    points: {
      /** Original pixel-center position [column, row], potentially subpixel. */
      point: [number, number];

      /** Original pixels per pixel at the selected pyramid level. */
      scale: number;

      /** Local average-gradient orientation in radians. */
      orientationRadians: number;

      /** Harris response at detection, in squared grayscale-byte units. */
      response: number;

      /** Owned 128-component normalized oriented gradient histogram. */
      descriptor: Float64Array;
    }[];

    /** Interior response maxima before localization and support admission. */
    rawCorners: number;

    /** Localized and oriented window-valid candidates before adaptive selection. */
    validCandidates: number;

    /**
     * Selected candidate count under the feature ceiling, before descriptor
     * construction.
     */
    selectedBeforeDescriptor: number;

    /**
     * Selected candidates withheld because their descriptor norm failed its
     * positive floor.
     */
    zeroDescriptors: number;

    /**
     * Selected candidates withheld when sampled descriptor coordinates cross
     * the admitted image support.
     */
    invalidSupportDescriptors: number;
  };
}
