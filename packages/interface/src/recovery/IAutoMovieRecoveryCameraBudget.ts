/** Finite positive integer limits for automatic image-pair work. */
export interface IAutoMovieRecoveryCameraBudget {
  /** Aggregate resident pixels of both images. */
  maxPixels: number;

  /** Descriptor-valid Harris candidates per image before spatial suppression. */
  maxCandidates: number;

  /** Retained physical interest points per image, no more than maxCandidates. */
  maxFeatures: number;

  /**
   * Maximum detection Gaussian-pyramid levels; pixels are downsampled without
   * upscaling.
   */
  maxPyramidLevels: number;

  /** Exact descriptor pairs compared, not descriptor scalar operations. */
  maxDescriptorPairs: number;

  /** Maximum proposals for each independent fundamental or homography consensus. */
  maxRansacTrials: number;

  /** Minimum proposals before adaptive conditional-confidence stopping. */
  minimumRansacTrials: number;

  /**
   * Maximum proposals with at least eight calibrated inliers refined in draw
   * order before winner comparison. Exhaustion can miss a better basin.
   */
  maxLocalRefinements: number;

  /**
   * Maximum local pose iterations per refit; at most three inlier refits are
   * attempted.
   */
  maxRefinementIterations: number;

  /** Maximum complete Jacobi sweeps per original-design decomposition. */
  maxSingularSweeps: number;
}
