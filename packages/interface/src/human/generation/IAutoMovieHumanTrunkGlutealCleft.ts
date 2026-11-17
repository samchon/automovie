/** Type contracts exchanged by AutoMovieHumanTrunkGlutealCleft; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkGlutealCleft {
  /** The cut argument of AutoMovieHumanTrunkGlutealCleft.at. The back's displacement toward the front at a height over the ring.
  @param rise Height over the crotch ring, mm.
  @param depth The back depth from the widest point, mm.
  @param cut Lateral places where the window starts to fall and has ended, mm.
  @returns The displacement and its first and second derivatives in z, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The back's displacement toward the front at a height over the ring.
 * @evidence contracts/development/design.md#principled-representation The back's displacement toward the front at a height over the ring. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkGlutealCleft.AtCut is the canonical exchange used by AutoMovieHumanTrunkGlutealCleft.at.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkGlutealCleft.at for the back's displacement toward the front at a height over the ring.
 */
  export type AtCut = readonly [number, number];

  /** Result of AutoMovieHumanTrunkGlutealCleft.at. The back's displacement toward the front at a height over the ring.
  @param rise Height over the crotch ring, mm.
  @param depth The back depth from the widest point, mm.
  @param cut Lateral places where the window starts to fall and has ended, mm.
  @returns The displacement and its first and second derivatives in z, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The back's displacement toward the front at a height over the ring.
 * @evidence contracts/development/design.md#principled-representation The back's displacement toward the front at a height over the ring. The callable takes z and returns [number, number, number].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkGlutealCleft.AtResult is the canonical exchange used by AutoMovieHumanTrunkGlutealCleft.at.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkGlutealCleft.at for the back's displacement toward the front at a height over the ring.
 */
  export type AtResult = (z: number) => [number, number, number];
}
