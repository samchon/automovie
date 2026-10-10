/**
 * One Deurenberg body fat regression: percent fat = bodyMassIndex · BMI +
 * ageYears · age + male · sex + intercept.
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
