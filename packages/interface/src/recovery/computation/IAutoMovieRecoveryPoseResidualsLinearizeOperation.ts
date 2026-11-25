import type { IAutoMovieRecoveryPoseModelCreationOperation } from "../../index";

/**
 * Signed pixel Sampson residuals and analytic five-coordinate local Jacobian.
 * With e=x2-transpose F x1 and d the joint epipolar-normal norm, each
 * derivative is de/d - (e/d)_sum((line/d)_(derivativeLine/d)). This
 * differentiates both the incidence and its pixel normalization; zero/undefined
 * lines refuse the fit.
 */

export namespace IAutoMovieRecoveryPoseResidualsLinearizeOperation {
  /**
   * Signed pixel Sampson residuals and analytic five-coordinate local Jacobian.
   * With e=x2-transpose F x1 and d the joint epipolar-normal norm, each
   * derivative is de/d - (e/d)_sum((line/d)_(derivativeLine/d)). This
   * differentiates both the incidence and its pixel normalization;
   * zero/undefined lines refuse the fit.
   */

  export type Operation = (
    model: ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation>,
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
  ) => {
    /**
     * Signed pixel residuals aligned with the supplied correspondence and
     * Jacobian row order.
     */
    residuals: number[];
    /** Residual derivative rows in the current pose tangent-coordinate ordering. */
    jacobian: number[][];
  };
}
