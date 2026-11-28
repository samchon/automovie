/**
 * Numeric rank ratios for the two camera-direction designs in an
 * aligned-ellipse fit. Each divides the smaller singular value by the larger.
 */
export interface IAutoMovieRecoveryImageDirectionRank {
  /**
   * Singular-value ratio of the two squared horizontal direction columns used
   * to solve for squared ellipse radii.
   */
  radii: number;

  /**
   * Singular-value ratio of the two signed horizontal direction columns used to
   * solve for section centers.
   */
  centres: number;
}
