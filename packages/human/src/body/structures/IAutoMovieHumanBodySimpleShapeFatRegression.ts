/**
 * One Deurenberg body fat regression: percent fat = bodyMassIndex · BMI +
 * ageYears · age + male · sex + intercept.
 *
 * @evidence contracts/common.md#principled-implementation One regression's four coefficients; the pediatric and adult regressions share this form.
 * @evidence contracts/common.md#clear-and-simple-design Four coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States the regression they belong to.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The coefficients relate BMI, years and percent; no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries Deurenberg's coefficients; the table documentation cites the study.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
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
