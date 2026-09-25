/**
 * A simple body parameter, or one the expansion derives from them, as the
 * abscissa of a term curve in the simple-tier table.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Names the five physical parameters and the derived body fat and developed muscle figures a relation can be read over.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Enumerates the curve abscissae the expansion table admits, including the derived excess body fat and developed muscle.
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
