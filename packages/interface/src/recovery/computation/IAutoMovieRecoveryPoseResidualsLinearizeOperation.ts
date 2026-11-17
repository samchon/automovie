import type { IAutoMovieRecoveryPoseModelCreationOperation } from "../../index";

/**
 * Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative is de/d - (e/d)*sum((line/d)*(derivativeLine/d)). This differentiates both the incidence and its pixel normalization; zero/undefined lines refuse the fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative
 * @evidence contracts/development/design.md#principled-representation Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative
 * @evidence contracts/development/design.md#minimal-and-owned-surface linearizeRecoveryPoseResiduals, refineRecoveryCameraPose share IAutoMovieRecoveryPoseResidualsLinearizeOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryPoseResidualsLinearizeOperation {
  /**
   * Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative is de/d - (e/d)*sum((line/d)*(derivativeLine/d)). This differentiates both the incidence and its pixel normalization; zero/undefined lines refuse the fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative
   * @evidence contracts/development/design.md#principled-representation Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative
   * @evidence contracts/development/design.md#minimal-and-owned-surface linearizeRecoveryPoseResiduals, refineRecoveryCameraPose share IAutoMovieRecoveryPoseResidualsLinearizeOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    model: ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation>,
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
  ) => {
    /** Signed pixel residuals aligned with the supplied correspondence and Jacobian row order. */
    residuals: number[];
    /** Residual derivative rows in the current pose tangent-coordinate ordering. */
    jacobian: number[][];
  };
}
