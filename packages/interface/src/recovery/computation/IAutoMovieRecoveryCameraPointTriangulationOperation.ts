import type { IAutoMovieRecoveryCameraChartCreationOperation } from "../../index";

/**
 * Triangulate one observation pair in the first-camera, unit-baseline gauge.
 * Original 4-by-4 DLT uses calibrated rays and P1=[I|0], P2=[R|t]. An
 * unresolved third design direction, point at infinity or nonfinite divided
 * coordinate returns null; a finite point behind a camera remains explicitly
 * nonpositive. Invalid or overflowing matrix actions and SVD nonconvergence
 * throw. This algebraic point is fitting evidence, not an independently
 * observed surface.
 */

export namespace IAutoMovieRecoveryCameraPointTriangulationOperation {
  /**
   * Triangulate one observation pair in the first-camera, unit-baseline gauge.
   * Original 4-by-4 DLT uses calibrated rays and P1=[I|0], P2=[R|t]. An
   * unresolved third design direction, point at infinity or nonfinite divided
   * coordinate returns null; a finite point behind a camera remains explicitly
   * nonpositive. Invalid or overflowing matrix actions and SVD nonconvergence
   * throw. This algebraic point is fitting evidence, not an independently
   * observed surface.
   */

  export type Operation = (
    firstPoint: readonly [number, number],
    secondPoint: readonly [number, number],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    pose: {
      /**
       * Row-major 3 by 3 camera rotation in the operation's declared
       * source-to-camera convention.
       */
      rotation: readonly number[];

      /**
       * Camera translation in the operation's admitted reconstruction scale;
       * two-view direction alone has no metric length.
       */
      translation: readonly [number, number, number];
    },
    minimumDesignRatio: number,
    maxSweeps: number,
  ) => {
    /**
     * Physical point in the source frame; camera triangulation uses the
     * admitted translation scale.
     */
    point: [number, number, number];

    /**
     * Signed point depth in the first camera's translation-scale coordinate
     * frame.
     */
    firstDepth: number;

    /**
     * Signed point depth in the second camera's translation-scale coordinate
     * frame.
     */
    secondDepth: number;

    /** True only when the triangulated point lies in front of both cameras. */
    positiveDepth: boolean;

    /**
     * Angle between the two viewing rays for this triangulated point, in
     * radians.
     */
    parallaxRadians: number;

    /**
     * Pixel discrepancy between the first observation and its point
     * reprojection.
     */
    firstReprojectionPx: number;

    /**
     * Pixel discrepancy between the second observation and its point
     * reprojection.
     */
    secondReprojectionPx: number;
  } | null;
}
