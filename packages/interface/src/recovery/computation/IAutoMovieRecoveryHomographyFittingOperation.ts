/**
 * Fit a normalized DLT image homography and its independently representable
 * inverse for a competing planar/pure-rotation explanation. It maps first-image
 * pixel centres to second-image pixel centres; it does not identify scene
 * depth.
 */

export namespace IAutoMovieRecoveryHomographyFittingOperation {
  /**
   * Fit a normalized DLT image homography and its independently representable
   * inverse for a competing planar/pure-rotation explanation. It maps
   * first-image pixel centres to second-image pixel centres; it does not
   * identify scene depth.
   */

  export type Operation = (
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
    minimumRatio: number,
    maxSweeps: number,
  ) => {
    /**
     * Row-major 3 by 3 image-to-image projective map in the declared pixel
     * charts.
     */
    matrix: number[];
    /** Row-major inverse of the admitted image-to-image homography. */
    inverse: number[];
    /**
     * Measured smallest over largest relevant design singular value;
     * dimensionless rank evidence.
     */
    designSingularRatio: number;
  };
}
