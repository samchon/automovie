/**
 * A lateral displacement window and its height-conditioned inguinal-fold jet
 * evaluator.
 *
 * The interface package owns these declarations;
 * AutoMovieHumanTrunkInguinalFold in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkInguinalFold {
  /**
   * The cut argument of AutoMovieHumanTrunkInguinalFold.at. The front's
   * displacement toward the back at a height over the ring.
   *
   * @param rise Height over the crotch ring, mm.
   * @param depth The front depth from the widest point, mm.
   * @param soft The fold's softness, mm.
   * @param cut Lateral places where the window starts to fall and has ended,
   *   mm.
   * @returns Displacement in mm, first derivative in mm/mm and second
   *   derivative in inverse mm, with respect to lateral z.
   */
  export type AtCut = readonly [number, number];

  /**
   * Result of AutoMovieHumanTrunkInguinalFold.at. The front's displacement
   * toward the back at a height over the ring.
   *
   * @param rise Height over the crotch ring, mm.
   * @param depth The front depth from the widest point, mm.
   * @param soft The fold's softness, mm.
   * @param cut Lateral places where the window starts to fall and has ended,
   *   mm.
   * @returns Displacement in mm, first derivative in mm/mm and second
   *   derivative in inverse mm, with respect to lateral z.
   */
  export type AtResult = (z: number) => [number, number, number];
}
