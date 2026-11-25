/**
 * A lateral displacement window and its height-conditioned gluteal-cleft jet
 * evaluator.
 *
 * The interface package owns these declarations;
 * AutoMovieHumanTrunkGlutealCleft in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkGlutealCleft {
  /**
   * The cut argument of AutoMovieHumanTrunkGlutealCleft.at. The back's
   * displacement toward the front at a height over the ring.
   *
   * @param rise Height over the crotch ring, mm.
   * @param depth The back depth from the widest point, mm.
   * @param cut Lateral places where the window starts to fall and has ended,
   *   mm.
   * @returns Displacement in mm, first derivative in mm/mm and second
   *   derivative in inverse mm, with respect to lateral z.
   */
  export type AtCut = readonly [number, number];

  /**
   * Result of AutoMovieHumanTrunkGlutealCleft.at. The back's displacement
   * toward the front at a height over the ring.
   *
   * @param rise Height over the crotch ring, mm.
   * @param depth The back depth from the widest point, mm.
   * @param cut Lateral places where the window starts to fall and has ended,
   *   mm.
   * @returns Displacement in mm, first derivative in mm/mm and second
   *   derivative in inverse mm, with respect to lateral z.
   */
  export type AtResult = (z: number) => [number, number, number];
}
