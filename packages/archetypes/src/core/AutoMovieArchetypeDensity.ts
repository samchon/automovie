/**
 * The densities of the materials producers weigh their parts by, kilograms per cubic metre: one owner each, so a steel part weighs the same in every producer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each constant is, its unit and its source.
 * @evidence contracts/development/design.md#principled-representation A material's density as one SI figure, read where a part's mass follows from its volume.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `STEEL`, read by a crossbow bolt's head, a ship's deck plating and a dumbbell's heads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No producer writes its own copy of a material's density.
 */
export namespace AutoMovieArchetypeDensity {
  /** Steel's density, kilograms per cubic metre: 7850, the 78.5 kN per cubic metre top of EN 1991-1-1:2002 Table A.4's 77.0 to 78.5 that structural practice adopts (https://www.phd.eng.br/wp-content/uploads/2015/12/en.1991.1.1.2002.pdf, p. 35; https://cdn.eurocodeapplied.com/design/en1993/steel-design-properties). */
  export const STEEL: number = 7850;
}
