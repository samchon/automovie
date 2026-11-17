/** Type contracts exchanged by AutoMovieHumanTrunkQuadrant; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkQuadrant {
  /** A side of the section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A side of the section.
   * @evidence contracts/development/design.md#principled-representation A side of the section. The closed alternatives are "front", "back".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmRootArc.share, AutoMovieHumanTrunkCourses.point, AutoMovieHumanTrunkFeatures.phaseAt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmRootArc.share, AutoMovieHumanTrunkCourses.point, AutoMovieHumanTrunkFeatures.phaseAt, AutoMovieHumanTrunkQuadrant.depth for a side of the section.
   */
  export type Side = "front" | "back";

  /** Result of AutoMovieHumanTrunkQuadrant.base. The base point of a side at a lateral share, before the displacements.
  @param s The section.
  @param side The quadrant.
  @param zeta Lateral share of the half width.
  @returns The point `[x, z]`, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The base point of a side at a lateral share, before the displacements.
 * @evidence contracts/development/design.md#principled-representation The base point of a side at a lateral share, before the displacements. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkQuadrant.BaseResult is the canonical exchange used by AutoMovieHumanTrunkQuadrant.base.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkQuadrant.base for the base point of a side at a lateral share, before the displacements.
 */
  export type BaseResult = [number, number];

  /** The speeds argument of AutoMovieHumanTrunkQuadrant.sector. The jet of a sector at a phase: the quintic Hermite between its two
  guides' jets over the phases `[t0, t1]`, each end leaving at its guide's
  speed, plus a displacement along x given as a function of z, per radian.
  @param a Guide at `t0`, its jet without the displacement.
  @param b Guide at `t1`, likewise.
  @param t0 Phase of the first guide.
  @param t1 Phase of the second guide.
  @param speeds Each end's speed, mm per radian of phase.
  @param t Phase, radians, between `t0` and `t1`.
  @param shift Displacement along x by z, `[f, f_z, f_zz]`, already signed for the side; null for none.
  @returns `[point, first derivative, second derivative]` in `[x, z]`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.
 * @evidence contracts/development/design.md#principled-representation The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkQuadrant.SectorSpeeds is the canonical exchange used by AutoMovieHumanTrunkQuadrant.sector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkQuadrant.sector for the jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.
 */
  export type SectorSpeeds = readonly [number, number];

  /** The shift argument of AutoMovieHumanTrunkQuadrant.sector. The jet of a sector at a phase: the quintic Hermite between its two
  guides' jets over the phases `[t0, t1]`, each end leaving at its guide's
  speed, plus a displacement along x given as a function of z, per radian.
  @param a Guide at `t0`, its jet without the displacement.
  @param b Guide at `t1`, likewise.
  @param t0 Phase of the first guide.
  @param t1 Phase of the second guide.
  @param speeds Each end's speed, mm per radian of phase.
  @param t Phase, radians, between `t0` and `t1`.
  @param shift Displacement along x by z, `[f, f_z, f_zz]`, already signed for the side; null for none.
  @returns `[point, first derivative, second derivative]` in `[x, z]`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.
 * @evidence contracts/development/design.md#principled-representation The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian. Alternatives are ((z: number) => [number, number, number]); null.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkQuadrant.SectorShift is the canonical exchange used by AutoMovieHumanTrunkQuadrant.sector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkQuadrant.sector for the jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.
 */
  export type SectorShift = ((z: number) => [number, number, number]) | null;

  /** Result of AutoMovieHumanTrunkQuadrant.sector. The jet of a sector at a phase: the quintic Hermite between its two
  guides' jets over the phases `[t0, t1]`, each end leaving at its guide's
  speed, plus a displacement along x given as a function of z, per radian.
  @param a Guide at `t0`, its jet without the displacement.
  @param b Guide at `t1`, likewise.
  @param t0 Phase of the first guide.
  @param t1 Phase of the second guide.
  @param speeds Each end's speed, mm per radian of phase.
  @param t Phase, radians, between `t0` and `t1`.
  @param shift Displacement along x by z, `[f, f_z, f_zz]`, already signed for the side; null for none.
  @returns `[point, first derivative, second derivative]` in `[x, z]`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.
 * @evidence contracts/development/design.md#principled-representation The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkQuadrant.SectorResult is the canonical exchange used by AutoMovieHumanTrunkQuadrant.sector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkQuadrant.sector for the jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.
 */
  export type SectorResult = [number[], number[], number[]];

  /** The knots argument of AutoMovieHumanTrunkQuadrant.between. The sector of the canonical left side between two guides as a function
  of phase, the displacement carried along when the sector lies where it
  acts.
  @param s The section's measures.
  @param side The quadrant the sector lies on.
  @param a Jet of the guide at the sector's start, without the displacement.
  @param b Jet of the guide at its end, without the displacement.
  @param knots Knots of the two guides.
  @param speeds Speeds of the two guides, mm per radian.
  @param folded Whether the displacement acts on the sector.
  @returns The sector's jet at a phase.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.
 * @evidence contracts/development/design.md#principled-representation The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkQuadrant.BetweenKnots is the canonical exchange used by AutoMovieHumanTrunkQuadrant.between.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkQuadrant.between for the sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.
 */
  export type BetweenKnots = readonly [number, number];

  /** The speeds argument of AutoMovieHumanTrunkQuadrant.between. The sector of the canonical left side between two guides as a function
  of phase, the displacement carried along when the sector lies where it
  acts.
  @param s The section's measures.
  @param side The quadrant the sector lies on.
  @param a Jet of the guide at the sector's start, without the displacement.
  @param b Jet of the guide at its end, without the displacement.
  @param knots Knots of the two guides.
  @param speeds Speeds of the two guides, mm per radian.
  @param folded Whether the displacement acts on the sector.
  @returns The sector's jet at a phase.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.
 * @evidence contracts/development/design.md#principled-representation The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkQuadrant.BetweenSpeeds is the canonical exchange used by AutoMovieHumanTrunkQuadrant.between.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkQuadrant.between for the sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.
 */
  export type BetweenSpeeds = readonly [number, number];

  /** Result of AutoMovieHumanTrunkQuadrant.between. The sector of the canonical left side between two guides as a function
  of phase, the displacement carried along when the sector lies where it
  acts.
  @param s The section's measures.
  @param side The quadrant the sector lies on.
  @param a Jet of the guide at the sector's start, without the displacement.
  @param b Jet of the guide at its end, without the displacement.
  @param knots Knots of the two guides.
  @param speeds Speeds of the two guides, mm per radian.
  @param folded Whether the displacement acts on the sector.
  @returns The sector's jet at a phase.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.
 * @evidence contracts/development/design.md#principled-representation The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts. The callable takes t and returns [number[], number[], number[]].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkQuadrant.BetweenResult is the canonical exchange used by AutoMovieHumanTrunkQuadrant.between.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkQuadrant.between for the sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.
 */
  export type BetweenResult = (t: number) => [number[], number[], number[]];
}
