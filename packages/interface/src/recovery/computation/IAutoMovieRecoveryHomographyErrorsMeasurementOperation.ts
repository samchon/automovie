/**
 * Measure the root-mean-square forward/backward homography transfer in pixels.
 * A mapped point on the projective horizon or an unrepresentable transfer is
 * null, which never counts as finite support for the planar competitor.
 */

export namespace IAutoMovieRecoveryHomographyErrorsMeasurementOperation {
  /**
   * Measure the root-mean-square forward/backward homography transfer in
   * pixels. A mapped point on the projective horizon or an unrepresentable
   * transfer is null, which never counts as finite support for the planar
   * competitor.
   */

  export type Operation = (
    model: {
      /**
       * Row-major 3 by 3 image-to-image projective map in the declared pixel
       * charts.
       */
      matrix: readonly number[];
      /** Row-major inverse of the admitted image-to-image homography. */
      inverse: readonly number[];
    },
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
  ) => (number | null)[];
}
