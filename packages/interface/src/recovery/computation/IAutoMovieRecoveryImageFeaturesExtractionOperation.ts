import type { IAutoMovieRecoveryCameraPairInput } from "../../index";

/**
 * Observe bounded multiscale Harris points and oriented gradient histograms.
 * Harris derivative sigma 1, integration 1.5 and average-gradient orientation
 * sigma 4.5 follow Brown, Szeliski and Winder (2005):
 * https://www.microsoft.com/en-us/research/wp-content/uploads/2005/06/cvpr05.pdf
 * A 4_4_8 trilinear histogram, unit normalization and .2 clipping follow Lowe's
 * descriptor construction, while this remains a Harris detector, not full SIFT:
 * https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf The 35-pixel oriented window,
 * 10-pixel bins and Gaussian sigma 20 define the declared experimental
 * descriptor chart. All positions return in original integer-pixel-centre
 * coordinates; no point is a verified material identity.
 */

export namespace IAutoMovieRecoveryImageFeaturesExtractionOperation {
  /**
   * Observe bounded multiscale Harris points and oriented gradient histograms.
   * Harris derivative sigma 1, integration 1.5 and average-gradient orientation
   * sigma 4.5 follow Brown, Szeliski and Winder (2005):
   * https://www.microsoft.com/en-us/research/wp-content/uploads/2005/06/cvpr05.pdf
   * A 4_4_8 trilinear histogram, unit normalization and .2 clipping follow
   * Lowe's descriptor construction, while this remains a Harris detector, not
   * full SIFT: https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf The 35-pixel
   * oriented window, 10-pixel bins and Gaussian sigma 20 define the declared
   * experimental descriptor chart. All positions return in original
   * integer-pixel-centre coordinates; no point is a verified material
   * identity.
   */

  export type Operation = (
    view: IAutoMovieRecoveryCameraPairInput["views"][number],
    policy: IAutoMovieRecoveryCameraPairInput["policy"],
    budget: IAutoMovieRecoveryCameraPairInput["budget"],
  ) => {
    /**
     * Selected image features with owned descriptors, in deterministic response
     * order.
     */
    points: {
      /** Image observation [x,y] in the original pixel-centre chart. */
      point: [number, number];

      /**
       * Image-feature support scale in pixels under the declared descriptor
       * convention.
       */
      scale: number;

      /** Measured local image-feature orientation in radians. */
      orientationRadians: number;

      /**
       * Detector response used for deterministic candidate ordering; its scale
       * is detector-specific.
       */
      response: number;

      /**
       * Owned normalized descriptor components; matching reads them without
       * modifying the feature.
       */
      descriptor: Float64Array;
    }[];

    /** Raw detector corner population before support and descriptor admission. */
    rawCorners: number;

    /**
     * Detected candidates whose image support satisfies the declared extraction
     * policy.
     */
    validCandidates: number;

    /**
     * Candidates retained by spatial/response selection before descriptor
     * generation.
     */
    selectedBeforeDescriptor: number;

    /** Rejected descriptors with zero usable norm. */
    zeroDescriptors: number;

    /** Descriptors rejected because the required image support is unavailable. */
    invalidSupportDescriptors: number;
  };
}
