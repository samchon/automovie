/**
 * Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization, following Hartley's normalized algorithm; this is an algebraic initializer, not a calibrated-pose fit or a pixel-error certificate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization,
 * @evidence contracts/development/design.md#principled-representation Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization,
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitRecoveryEpipolarConsensus, fitRecoveryEpipolarMatrix share IAutoMovieRecoveryEpipolarMatrixFittingOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryEpipolarMatrixFittingOperation {
  /**
   * Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization, following Hartley's normalized algorithm; this is an algebraic initializer, not a calibrated-pose fit or a pixel-error certificate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization,
   * @evidence contracts/development/design.md#principled-representation Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization,
   * @evidence contracts/development/design.md#minimal-and-owned-surface fitRecoveryEpipolarConsensus, fitRecoveryEpipolarMatrix share IAutoMovieRecoveryEpipolarMatrixFittingOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
    minimumRatio: number,
    maxSweeps: number,
  ) => {
    /** Row-major 3 by 3 epipolar model in the declared image charts; homogeneous scale is arbitrary. */
    matrix: number[];
    /** Measured smallest over largest relevant design singular value; dimensionless rank evidence. */
    designSingularRatio: number;
  };
}
