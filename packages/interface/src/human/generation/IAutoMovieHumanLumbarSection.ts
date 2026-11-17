/** Type contracts exchanged by AutoMovieHumanLumbarSection; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLumbarSection {
  /** Result of AutoMovieHumanLumbarSection.box. The box of a lumbar level at its girth.
  @param measures A person's resolved measures, for the sex.
  @param girth The level's taut-tape girth, mm.
  @returns The level's breadth and depth, mm, whose box's range holds the girth.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The box of a lumbar level at its girth.
 * @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLumbarSection.IBoxResult is the canonical exchange used by AutoMovieHumanLumbarSection.box.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `depth`; callers supply the complete record.
 */
  export type IBoxResult = {
    /** Full transverse section breadth, millimetres. */
    breadth: number;
    /** Full front-to-back section depth, millimetres. */
    depth: number;
  };
}
