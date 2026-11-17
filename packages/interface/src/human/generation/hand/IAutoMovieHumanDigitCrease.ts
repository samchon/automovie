/** Type contracts exchanged by AutoMovieHumanDigitCrease; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanDigitCrease {
  /** A crease's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A crease's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `at`: Arc length of the crease along the digit's line, mm. `palmar`: The palmar depth of the section there, mm. `radius`: The nearest joint's radius, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDigitProfile.creasesOf. Read by AutoMovieHumanDigitCrease.depth. Also types AutoMovieHumanDigitProfile.creases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `palmar`, `radius`; callers supply the complete record.
   */
  export interface IInput {
    /** Arc length of the crease along the digit's line, mm. */
    at: number;

    /** The palmar depth of the section there, mm. */
    palmar: number;

    /** The nearest joint's radius, mm. */
    radius: number;
  }

  /** The joints argument of AutoMovieHumanDigitCrease.loci. The creases' arc lengths along a finger from its joints, by Bridgman's
  rule.
  @param joints Arc lengths of the finger's MCP, PIP and DIP along its line, mm.
  @returns The four creases' arc lengths, distal first.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The creases' arc lengths along a finger from its joints, by Bridgman's rule.
 * @evidence contracts/development/design.md#principled-representation The creases' arc lengths along a finger from its joints, by Bridgman's rule. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitCrease.LociJoints is the canonical exchange used by AutoMovieHumanDigitCrease.loci.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitCrease.loci for the creases' arc lengths along a finger from its joints, by Bridgman's rule.
 */
  export type LociJoints = readonly [number, number, number];

  /** Result of AutoMovieHumanDigitCrease.loci. The creases' arc lengths along a finger from its joints, by Bridgman's
  rule.
  @param joints Arc lengths of the finger's MCP, PIP and DIP along its line, mm.
  @returns The four creases' arc lengths, distal first.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The creases' arc lengths along a finger from its joints, by Bridgman's rule.
 * @evidence contracts/development/design.md#principled-representation The creases' arc lengths along a finger from its joints, by Bridgman's rule. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitCrease.LociResult is the canonical exchange used by AutoMovieHumanDigitCrease.loci.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitCrease.loci for the creases' arc lengths along a finger from its joints, by Bridgman's rule.
 */
  export type LociResult = [number, number, number, number];
}
