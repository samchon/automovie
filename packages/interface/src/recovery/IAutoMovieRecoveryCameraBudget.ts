/**
 * Positive safe integer limits for observing and fitting a calibrated camera
 * pair. Map and scene estimation also reuse the per-view extraction and
 * per-direction matching ceilings.
 */
export interface IAutoMovieRecoveryCameraBudget {
  /** Maximum total resident pixels in the two seed images. */
  maxPixels: number;

  /** Maximum window-valid Harris candidates per image before spatial selection. */
  maxCandidates: number;

  /** Maximum selected detector candidates per image, at most `maxCandidates`. */
  maxFeatures: number;

  /**
   * Maximum detection pyramid levels. Downsampling stops when the image becomes
   * too small for the detector window.
   */
  maxPyramidLevels: number;

  /** Maximum actual descriptor comparisons in one directed search. */
  maxDescriptorPairs: number;

  /**
   * Maximum proposals in each independent epipolar or homography consensus
   * search.
   */
  maxRansacTrials: number;

  /**
   * Minimum proposals before conditional-confidence stopping, at most
   * `maxRansacTrials`.
   */
  minimumRansacTrials: number;

  /**
   * Maximum eligible epipolar proposals entering local refinement in draw
   * order.
   */
  maxLocalRefinements: number;

  /** Maximum nonlinear iterations in one fixed-subset pose refit. */
  maxRefinementIterations: number;

  /** Maximum Jacobi sweeps per design singular decomposition. */
  maxSingularSweeps: number;
}
