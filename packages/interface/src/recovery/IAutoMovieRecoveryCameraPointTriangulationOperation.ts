import type { IAutoMovieRecoveryCameraChartCreationOperation } from "..";

/**
 * Callable triangulation of one calibrated observation pair in first-camera
 * axes and the supplied translation scale.
 */

export namespace IAutoMovieRecoveryCameraPointTriangulationOperation {
  /**
   * Transform measured pixels through the inverse charts, then solve the
   * original four-row homogeneous design for cameras `[I | 0]` and `[R | t]`.
   * Unresolved ray angle or rank, a point at infinity, or unavailable depths or
   * residuals can return null. A finite point behind a camera carries signed
   * depths. Nonrepresentable matrix actions and failed singular decomposition
   * can raise an error.
   */

  export type Operation = (
    firstPoint: readonly [number, number],
    secondPoint: readonly [number, number],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    pose: {
      /**
       * Nine row-major coefficients rotating the first camera coordinates into
       * the second.
       */
      rotation: readonly number[];

      /**
       * Additive second-camera translation whose length sets the reconstruction
       * scale.
       */
      translation: readonly [number, number, number];
    },
    minimumDesignRatio: number,
    maxSweeps: number,
  ) => {
    /**
     * Dehomogenized [X, Y, Z] in first-camera axes and the supplied translation
     * scale.
     */
    point: [number, number, number];

    /** Signed first-camera Z in the supplied translation scale. */
    firstDepth: number;

    /** Signed second-camera Z in the supplied translation scale. */
    secondDepth: number;

    /** True when both signed camera depths are positive. */
    positiveDepth: boolean;

    /**
     * Measured angle between the calibrated rays in the first camera
     * coordinates, in radians.
     */
    parallaxRadians: number;

    /**
     * Euclidean pixel residual of the returned point in the original first
     * image.
     */
    firstReprojectionPx: number;

    /**
     * Euclidean pixel residual of the returned point in the original second
     * image.
     */
    secondReprojectionPx: number;
  } | null;
}
