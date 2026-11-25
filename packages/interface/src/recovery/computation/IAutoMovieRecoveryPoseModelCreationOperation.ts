import type { IAutoMovieRecoveryCameraChartCreationOperation } from "../../index";

/**
 * Pixel epipolar model and its five local calibrated-pose derivatives. Rotation
 * increments act on the left in radians; translation increments use two raw
 * directions of the admitted near-unit translation. The complete signed Sampson
 * quotient cancels the positive translation-normalization scale, so its
 * derivative uses these raw directions even when DN(t)B differs from B. No
 * camera covariance or global optimum follows.
 */

export namespace IAutoMovieRecoveryPoseModelCreationOperation {
  /**
   * Pixel epipolar model and its five local calibrated-pose derivatives.
   * Rotation increments act on the left in radians; translation increments use
   * two raw directions of the admitted near-unit translation. The complete
   * signed Sampson quotient cancels the positive translation-normalization
   * scale, so its derivative uses these raw directions even when DN(t)B differs
   * from B. No camera covariance or global optimum follows.
   */

  export type Operation = (
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
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
  ) => {
    /**
     * Row-major 3 by 3 epipolar model in the declared image charts; homogeneous
     * scale is arbitrary.
     */
    matrix: number[];

    /**
     * Derivative matrices of the current epipolar model, ordered by the
     * declared pose tangent coordinates.
     */
    derivatives: number[][];

    /**
     * Local translation-direction tangent basis used with the current rotation
     * increments.
     */
    tangent: [number, number, number][];
  };
}
