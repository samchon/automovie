/** Type contracts exchanged by AutoMovieHumanMetacarpalArch; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanMetacarpalArch {
  /** An arch's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An arch's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `centre`: The metacarpal axis's place in the section, `[b, c]`, mm. `root`: The finger root's skin half width, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMetacarpalArch.radius, AutoMovieHumanMetacarpalArch.arc.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `root`; callers supply the complete record.
   */
  export interface IInput {
    /** The metacarpal axis's place in the section, `[b, c]`, mm. */
    centre: [number, number];

    /** The finger root's skin half width, mm. */
    root: number;
  }

  /** Result of AutoMovieHumanMetacarpalArch.arc. Points of the dorsal arc between two angles about the metacarpal axis,
  angle 0 toward the thumb along `b` and increasing toward the back of the
  hand (`-c`).
  @param input The arch's inputs.
  @param from First angle, radians.
  @param to Last angle, radians.
  @param count Points, at least 2.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Points of the dorsal arc between two angles about the metacarpal axis, angle 0 toward the thumb along `b` and increasing toward the back of the hand (`-c`).
 * @evidence contracts/development/design.md#principled-representation Points of the dorsal arc between two angles about the metacarpal axis, angle 0 toward the thumb along `b` and increasing toward the back of the hand (`-c`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanMetacarpalArch.ArcResult is the canonical exchange used by AutoMovieHumanMetacarpalArch.arc.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanMetacarpalArch.arc for points of the dorsal arc between two angles about the metacarpal axis, angle 0 toward the thumb along `b` and increasing toward the back of the hand (`-c`).
 */
  export type ArcResult = [number, number][];
}
