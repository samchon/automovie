import type { IAutoMovieRecoveryPoseModelCreationOperation } from "..";

/** Callable signed Sampson residuals and analytic five-parameter pose Jacobian. */

export namespace IAutoMovieRecoveryPoseResidualsLinearizeOperation {
  /**
   * Use equal-length original pixel pairs and a pose model with five
   * fundamental-matrix derivatives. Differentiate both signed incidence and the
   * joint epipolar normal length. Return one residual and one Jacobian row per
   * correspondence. Missing directions or undefined epipolar normals raise an
   * error.
   */

  export type Operation = (
    model: ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation>,
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
  ) => {
    /** Signed Sampson residuals in pixels, in correspondence order. */
    residuals: number[];
    /**
     * One derivative row per correspondence, with five columns in model tangent
     * order.
     */
    jacobian: number[][];
  };
}
