/**
 * Finite positive integer limits for automatic image-pair work.
 *
 * @evidence contracts/common.md#principled-implementation Pixels, candidate positions, retained features, compared descriptor pairs and numerical iterations are distinct work populations.
 * @evidence contracts/common.md#clear-and-simple-design The recovery admission owner checks these limits before their corresponding allocation or traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A budget is an upper work bound, never an observation or a promise that a camera will be identifiable.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish aggregate pixels, per-image populations, proposal counts and per-refit iteration limits.
 */
export interface IAutoMovieRecoveryCameraBudget {
  /** Aggregate resident pixels of both images. */
  maxPixels: number;

  /** Descriptor-valid Harris candidates per image before spatial suppression. */
  maxCandidates: number;

  /** Retained physical interest points per image, no more than maxCandidates. */
  maxFeatures: number;

  /** Maximum detection Gaussian-pyramid levels; pixels are downsampled without upscaling. */
  maxPyramidLevels: number;

  /** Exact descriptor pairs compared, not descriptor scalar operations. */
  maxDescriptorPairs: number;

  /** Maximum proposals for each independent fundamental or homography consensus. */
  maxRansacTrials: number;

  /** Minimum proposals before adaptive conditional-confidence stopping. */
  minimumRansacTrials: number;

  /** Maximum proposals with at least eight calibrated inliers refined in draw order before winner comparison. Exhaustion can miss a better basin. */
  maxLocalRefinements: number;

  /** Maximum local pose iterations per refit; at most three inlier refits are attempted. */
  maxRefinementIterations: number;

  /** Maximum complete Jacobi sweeps per original-design decomposition. */
  maxSingularSweeps: number;
}
