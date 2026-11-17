/** Type contracts exchanged by AutoMovieHumanTrunkInguinalFold; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkInguinalFold {
  /** The cut argument of AutoMovieHumanTrunkInguinalFold.at. The front's displacement toward the back at a height over the ring.
  @param rise Height over the crotch ring, mm.
  @param depth The front depth from the widest point, mm.
  @param soft The fold's softness, mm.
  @param cut Lateral places where the window starts to fall and has ended, mm.
  @returns The displacement and its first and second derivatives in z, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The front's displacement toward the back at a height over the ring.
 * @evidence contracts/development/design.md#principled-representation The front's displacement toward the back at a height over the ring. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkInguinalFold.AtCut is the canonical exchange used by AutoMovieHumanTrunkInguinalFold.at.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkInguinalFold.at for the front's displacement toward the back at a height over the ring.
 */
  export type AtCut = readonly [number, number];

  /** Result of AutoMovieHumanTrunkInguinalFold.at. The front's displacement toward the back at a height over the ring.
  @param rise Height over the crotch ring, mm.
  @param depth The front depth from the widest point, mm.
  @param soft The fold's softness, mm.
  @param cut Lateral places where the window starts to fall and has ended, mm.
  @returns The displacement and its first and second derivatives in z, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The front's displacement toward the back at a height over the ring.
 * @evidence contracts/development/design.md#principled-representation The front's displacement toward the back at a height over the ring. The callable takes z and returns [number, number, number].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkInguinalFold.AtResult is the canonical exchange used by AutoMovieHumanTrunkInguinalFold.at.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkInguinalFold.at for the front's displacement toward the back at a height over the ring.
 */
  export type AtResult = (z: number) => [number, number, number];
}
