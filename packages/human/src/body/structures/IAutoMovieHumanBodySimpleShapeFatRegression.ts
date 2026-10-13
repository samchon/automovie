/**
 * One Deurenberg body fat regression: percent fat = bodyMassIndex · BMI +
 * ageYears · age + male · sex + intercept.
 *
 * @evidence contracts/common.md#principled-implementation Four coefficients express an affine estimate over BMI, age and the male indicator; evaluation owns their domain and precision.
 * @evidence contracts/common.md#clear-and-simple-design The record contains only coefficients, leaving arithmetic in the shared simple-shape owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person's expected fat value is stored in the coefficient schema.
 * @evidence contracts/common.md#meaningful-documentation Each member identifies its predictor, and the prose gives the regression equation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The fat regression coefficient schema declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fat regression coefficient schema schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The fat regression coefficient schema type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeFatRegression {
  /** Coefficient of the body mass index. */
  bodyMassIndex: number;

  /** Coefficient of age in years. */
  ageYears: number;

  /** Coefficient of the male indicator. */
  male: number;

  /** The constant term. */
  intercept: number;
}
