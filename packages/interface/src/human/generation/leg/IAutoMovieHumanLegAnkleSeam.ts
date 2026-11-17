/**
 * Canonical section-plane rings and centres used to compare the ankle boundary with its leg law.
 *
 * The interface package owns these declarations; AutoMovieHumanLegAnkleSeam in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Canonical section-plane rings and centres used to compare the ankle boundary with its leg law. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only ResidualRing, ResidualCentre, LiftRing, LiftCentre declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation ResidualRing, ResidualCentre, LiftRing, LiftCentre separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanLegAnkleSeam exchanges the named ResidualRing, ResidualCentre, LiftRing, LiftCentre contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanLegAnkleSeam {
  /** The ring argument of AutoMovieHumanLegAnkleSeam.residual. The ring's radius about a centre at each leg phase, less the leg law's own
  radius there: the ring's difference from the law.
  @param ring The ring in the section plane, canonical, `[x, z]`.
  @param centre The law's own centre at the ring.
  @param radii The law's radii at the leg's phases.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The ring's radius about a centre at each leg phase, less the leg law's own radius there: the ring's difference from the law.
 * @evidence contracts/development/design.md#principled-representation The ring's radius about a centre at each leg phase, less the leg law's own radius there: the ring's difference from the law. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegAnkleSeam.ResidualRing is the canonical exchange used by AutoMovieHumanLegAnkleSeam.residual.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegAnkleSeam.residual for the ring's radius about a centre at each leg phase, less the leg law's own radius there: the ring's difference from the law.
 */
  export type ResidualRing = readonly [number, number][];

  /** The centre argument of AutoMovieHumanLegAnkleSeam.residual. The ring's radius about a centre at each leg phase, less the leg law's own
  radius there: the ring's difference from the law.
  @param ring The ring in the section plane, canonical, `[x, z]`.
  @param centre The law's own centre at the ring.
  @param radii The law's radii at the leg's phases.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The ring's radius about a centre at each leg phase, less the leg law's own radius there: the ring's difference from the law.
 * @evidence contracts/development/design.md#principled-representation The ring's radius about a centre at each leg phase, less the leg law's own radius there: the ring's difference from the law. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegAnkleSeam.ResidualCentre is the canonical exchange used by AutoMovieHumanLegAnkleSeam.residual.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegAnkleSeam.residual for the ring's radius about a centre at each leg phase, less the leg law's own radius there: the ring's difference from the law.
 */
  export type ResidualCentre = readonly [number, number];

  /** The ring argument of AutoMovieHumanLegAnkleSeam.lift. A ring's height off its plane at each canonical phase, read off its
  nearest edge.
  @param ring The ring in the plane, `[x, z]`.
  @param centre The centre the phases are read about.
  @param world The ring's world points, one per ring point.
  @param level Height of the plane.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A ring's height off its plane at each canonical phase, read off its nearest edge.
 * @evidence contracts/development/design.md#principled-representation A ring's height off its plane at each canonical phase, read off its nearest edge. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegAnkleSeam.LiftRing is the canonical exchange used by AutoMovieHumanLegAnkleSeam.lift.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegAnkleSeam.lift for a ring's height off its plane at each canonical phase, read off its nearest edge.
 */
  export type LiftRing = readonly [number, number][];

  /** The centre argument of AutoMovieHumanLegAnkleSeam.lift. A ring's height off its plane at each canonical phase, read off its
  nearest edge.
  @param ring The ring in the plane, `[x, z]`.
  @param centre The centre the phases are read about.
  @param world The ring's world points, one per ring point.
  @param level Height of the plane.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A ring's height off its plane at each canonical phase, read off its nearest edge.
 * @evidence contracts/development/design.md#principled-representation A ring's height off its plane at each canonical phase, read off its nearest edge. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegAnkleSeam.LiftCentre is the canonical exchange used by AutoMovieHumanLegAnkleSeam.lift.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegAnkleSeam.lift for a ring's height off its plane at each canonical phase, read off its nearest edge.
 */
  export type LiftCentre = readonly [number, number];
}
