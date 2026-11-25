/**
 * The affine natural-waist regression coefficients used to relate men's
 * omphalion and buttock circumferences.
 *
 * The interface package owns these declarations; AutoMovieHumanBodyFat in Human
 * supplies their runtime values.
 */
export namespace IAutoMovieHumanBodyFat {
  /**
   * Men's natural waist on omphalion waist and buttock circumference, mm:
   * `natural = 106.84 + 0.7868 omphalion + 0.0554 buttock`, ANSUR 1988, R2 0.92
   * (`docs/sources/ansur-1988.md`). Inverted, it gives the navel-level abdomen
   * the men's circumference estimate reads.
   */
  export type IMenNaturalWaist = {
    /**
     * Intercept of the table's affine predictor, in the response quantity's
     * documented unit.
     */
    readonly a: number;
    /**
     * Coefficient on abdomen circumference at the omphalion in the
     * natural-waist regression, millimetres per millimetre.
     */
    readonly omphalion: number;
    /**
     * Coefficient on buttock circumference in the natural-waist regression,
     * millimetres per millimetre.
     */
    readonly buttock: number;
  };
}
