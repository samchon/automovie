import type { AutoMovieHumanSexPair } from "../AutoMovieHumanSexPair";

/**
 * Sex-specific lower-thigh regression coefficients with stature, BMI and age units. Runtime construction and admission remain with AutoMovieHumanBodyCourses in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes sex-specific lower-thigh regression coefficients with stature, BMI and age units; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Sex-specific lower-thigh regression coefficients with stature, BMI and age units. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanBodyCourses; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing BodyCourses contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanBodyCourses {
  /** Lower thigh circumference at suprapatella on stature, body mass index and
  age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model
  B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm,
  `a + stature S + bmi BMI + age A` with S in mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lower thigh circumference at suprapatella on stature, body mass index and age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm, `a + stature S + bmi BMI + age A` with S in mm.
 * @evidence contracts/development/design.md#principled-representation Lower thigh circumference at suprapatella on stature, body mass index and age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm, `a + stature S + bmi BMI + age A` with S in mm. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyCourses.LowerThighModel is the canonical exchange used by AutoMovieHumanBodyCourses.LOWER_THIGH_MODEL.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyCourses.LOWER_THIGH_MODEL for lower thigh circumference at suprapatella on stature, body mass index and age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm, `a + stature S + bmi BMI + age A` with S in mm.
 */
  export type LowerThighModel = AutoMovieHumanSexPair<{
    /** Intercept of the table's affine predictor, in the response quantity's documented unit. */
    readonly a: number;
    /** Lower-thigh regression coefficient per millimetre of stature, millimetres per millimetre. */
    readonly stature: number;
    /** Lower-thigh regression coefficient per unit of BMI, millimetres per kg/m2. */
    readonly bmi: number;
    /** Lower-thigh regression coefficient per year of age, millimetres per year. */
    readonly age: number;
  }>;
}
