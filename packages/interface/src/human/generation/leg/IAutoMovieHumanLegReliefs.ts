/**
 * Type contracts exchanged by AutoMovieHumanLegReliefs; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanLegReliefs {
  /**
   * The girth argument of AutoMovieHumanLegReliefs.of. The reliefs of one leg.
   *
   * @param bones The joints' heights, mm.
   * @param girth The girth the law asks for at a station, mm.
   * @param span The leg's own stations, from the ankle ring to the crotch
   *   ring, mm.
   * @param crotchReach The span under the crotch ring over which the trunk's
   *   ring hands the skin over to the leg's law, mm; a window anchored at the
   *   crotch stands at its end. Absent (a leg read without its crotch ring),
   *   every window stands at its share.
   * @param diagnostics The list a relief that cannot be placed is recorded in;
   *   the leg keeps its base there (level 3 for a bump, 4 for a recess).
   * @param furrow The person's gluteal furrow height, mm: a window anchored at
   *   the crotch stands there when it lies inside the leg, the fold being where
   *   the furrow is.
   */
  export type OfGirth = (s: number) => number;

  /**
   * The span argument of AutoMovieHumanLegReliefs.of. The reliefs of one leg.
   *
   * @param bones The joints' heights, mm.
   * @param girth The girth the law asks for at a station, mm.
   * @param span The leg's own stations, from the ankle ring to the crotch
   *   ring, mm.
   * @param crotchReach The span under the crotch ring over which the trunk's
   *   ring hands the skin over to the leg's law, mm; a window anchored at the
   *   crotch stands at its end. Absent (a leg read without its crotch ring),
   *   every window stands at its share.
   * @param diagnostics The list a relief that cannot be placed is recorded in;
   *   the leg keeps its base there (level 3 for a bump, 4 for a recess).
   * @param furrow The person's gluteal furrow height, mm: a window anchored at
   *   the crotch stands there when it lies inside the leg, the fold being where
   *   the furrow is.
   */
  export type OfSpan = readonly [number, number];
}
