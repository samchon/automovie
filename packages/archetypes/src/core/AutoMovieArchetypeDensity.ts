/**
 * Nominal material densities for computing modeled body and part masses.
 */
export namespace AutoMovieArchetypeDensity {
  /**
   * Nominal steel density of 7,850 kilograms per cubic metre.
   *
   * Multiply solid volume by this value to estimate a steel model's mass.
   *
   * @see https://cdn.eurocodeapplied.com/design/en1993/steel-design-properties
   */
  export const STEEL: number = 7850;
}
