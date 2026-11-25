import type { AutoMovieHumanSexPair } from "../AutoMovieHumanSexPair";

/**
 * Sex-specific lower-thigh regression coefficients with stature, BMI and age
 * units. Runtime construction and admission remain with
 * AutoMovieHumanBodyCourses in Human.
 */
export namespace IAutoMovieHumanBodyCourses {
  /**
   * Lower thigh circumference at suprapatella on stature, body mass index and
   * age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model B
   * girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm, `a +
   * stature S + bmi BMI + age A` with S in mm.
   */
  export type LowerThighModel = AutoMovieHumanSexPair<{
    /**
     * Intercept of the table's affine predictor, in the response quantity's
     * documented unit.
     */
    readonly a: number;
    /**
     * Lower-thigh regression coefficient per millimetre of stature, millimetres
     * per millimetre.
     */
    readonly stature: number;
    /**
     * Lower-thigh regression coefficient per unit of BMI, millimetres per
     * kg/m2.
     */
    readonly bmi: number;
    /** Lower-thigh regression coefficient per year of age, millimetres per year. */
    readonly age: number;
  }>;
}
