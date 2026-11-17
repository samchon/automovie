/** Type contracts exchanged by AutoMovieHumanFootToeTaper; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootToeTaper {
  /** Independent half-width, plantar-depth and dorsal-depth shares relative to their values at the web; these dimensionless components are not a point or derivative jet. The taper's shares at a length along the line: half width, plantar and
  dorsal depth, each over its value at the web.
  @param index Which toe, 0 for the hallux.
  @param length The line's length, head to apex, mm.
  @param shaft The toe's shaft half breadth, mm.
  @param s Length along the line from the metatarsal head, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Independent half-width, plantar-depth and dorsal-depth shares relative to their values at the web; these dimensionless components are not a point or derivative jet.
 * @evidence contracts/development/design.md#principled-representation Independent half-width, plantar-depth and dorsal-depth shares relative to their values at the web; these dimensionless components are not a point or derivative jet. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootToeTaper.AtResult is the canonical exchange used by AutoMovieHumanFootToeTaper.at.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootToeTaper.at for independent half-width, plantar-depth and dorsal-depth shares relative to their values at the web; these dimensionless components are not a point or derivative jet.
 */
  export type AtResult = [
    halfWidthShare: number,
    plantarDepthShare: number,
    dorsalDepthShare: number,
  ];
}
