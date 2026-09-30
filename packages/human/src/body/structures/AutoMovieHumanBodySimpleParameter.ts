/**
 * A simple body parameter, or one the expansion derives from them, as the
 * abscissa of a term curve in the simple-tier table.
 *
 * @author Samchon
 */
export type AutoMovieHumanBodySimpleParameter =
  | "sex"
  | "ageYears"
  | "bodyMassIndex"
  | "muscle"
  /**
   * The muscle parameter as far as the body has matured to build it: muscle
   * times the maturity ramp over adolescence, so a relation calibrated on
   * adult training reaches a child only as the adolescent muscle spurt does.
   */
  | "developedMuscle"
  /** Deurenberg's body fat percent less the sex's essential fat. */
  | "excessFatPercent";
