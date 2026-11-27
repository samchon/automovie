/**
 * Type contracts exchanged by AutoMovieHumanTrunkQuadrant; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkQuadrant {
  /** A side of the section. */
  export type Side = "front" | "back";

  /**
   * Result of AutoMovieHumanTrunkQuadrant.base. The base point of a side at a
   * lateral share, before the displacements.
   *
   * @param s The section.
   * @param side The quadrant.
   * @param zeta Lateral share of the half width.
   * @returns The point `[x, z]`, mm.
   */
  export type BaseResult = [number, number];

  /**
   * The speeds argument of AutoMovieHumanTrunkQuadrant.sector. The jet of a
   * sector at a phase: the quintic Hermite between its two guides' jets over
   * the phases `[t0, t1]`, each end leaving at its guide's speed, plus a
   * displacement along x given as a function of z, per radian.
   *
   * @param a Guide at `t0`, its jet without the displacement.
   * @param b Guide at `t1`, likewise.
   * @param t0 Phase of the first guide.
   * @param t1 Phase of the second guide.
   * @param speeds Each end's speed, mm per radian of phase.
   * @param t Phase, radians, between `t0` and `t1`.
   * @param shift Displacement along x by z, `[f, f_z, f_zz]`, already signed
   *   for the side; null for none.
   * @returns `[point, first derivative, second derivative]` in `[x, z]`.
   */
  export type SectorSpeeds = readonly [number, number];

  /**
   * The shift argument of AutoMovieHumanTrunkQuadrant.sector. The jet of a
   * sector at a phase: the quintic Hermite between its two guides' jets over
   * the phases `[t0, t1]`, each end leaving at its guide's speed, plus a
   * displacement along x given as a function of z, per radian.
   *
   * @param a Guide at `t0`, its jet without the displacement.
   * @param b Guide at `t1`, likewise.
   * @param t0 Phase of the first guide.
   * @param t1 Phase of the second guide.
   * @param speeds Each end's speed, mm per radian of phase.
   * @param t Phase, radians, between `t0` and `t1`.
   * @param shift Displacement along x by z, `[f, f_z, f_zz]`, already signed
   *   for the side; null for none.
   * @returns `[point, first derivative, second derivative]` in `[x, z]`.
   */
  export type SectorShift = ((z: number) => [number, number, number]) | null;

  /**
   * Result of AutoMovieHumanTrunkQuadrant.sector. The jet of a sector at a
   * phase: the quintic Hermite between its two guides' jets over the phases
   * `[t0, t1]`, each end leaving at its guide's speed, plus a displacement
   * along x given as a function of z, per radian.
   *
   * @param a Guide at `t0`, its jet without the displacement.
   * @param b Guide at `t1`, likewise.
   * @param t0 Phase of the first guide.
   * @param t1 Phase of the second guide.
   * @param speeds Each end's speed, mm per radian of phase.
   * @param t Phase, radians, between `t0` and `t1`.
   * @param shift Displacement along x by z, `[f, f_z, f_zz]`, already signed
   *   for the side; null for none.
   * @returns `[point, first derivative, second derivative]` in `[x, z]`.
   */
  export type SectorResult = [number[], number[], number[]];

  /**
   * The knots argument of AutoMovieHumanTrunkQuadrant.between. The sector of
   * the canonical left side between two guides as a function of phase, the
   * displacement carried along when the sector lies where it acts.
   *
   * @param s The section's measures.
   * @param side The quadrant the sector lies on.
   * @param a Jet of the guide at the sector's start, without the displacement.
   * @param b Jet of the guide at its end, without the displacement.
   * @param knots Knots of the two guides.
   * @param speeds Speeds of the two guides, mm per radian.
   * @param folded Whether the displacement acts on the sector.
   * @returns The sector's jet at a phase.
   */
  export type BetweenKnots = readonly [number, number];

  /**
   * The speeds argument of AutoMovieHumanTrunkQuadrant.between. The sector of
   * the canonical left side between two guides as a function of phase, the
   * displacement carried along when the sector lies where it acts.
   *
   * @param s The section's measures.
   * @param side The quadrant the sector lies on.
   * @param a Jet of the guide at the sector's start, without the displacement.
   * @param b Jet of the guide at its end, without the displacement.
   * @param knots Knots of the two guides.
   * @param speeds Speeds of the two guides, mm per radian.
   * @param folded Whether the displacement acts on the sector.
   * @returns The sector's jet at a phase.
   */
  export type BetweenSpeeds = readonly [number, number];

  /**
   * Result of AutoMovieHumanTrunkQuadrant.between. The sector of the canonical
   * left side between two guides as a function of phase, the displacement
   * carried along when the sector lies where it acts.
   *
   * @param s The section's measures.
   * @param side The quadrant the sector lies on.
   * @param a Jet of the guide at the sector's start, without the displacement.
   * @param b Jet of the guide at its end, without the displacement.
   * @param knots Knots of the two guides.
   * @param speeds Speeds of the two guides, mm per radian.
   * @param folded Whether the displacement acts on the sector.
   * @returns The sector's jet at a phase.
   */
  export type BetweenResult = (t: number) => [number[], number[], number[]];
}
