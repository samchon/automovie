/**
 * Canonical section-plane rings and centres used to compare the ankle boundary
 * with its leg law.
 *
 * The interface package owns these declarations; AutoMovieHumanLegAnkleSeam in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegAnkleSeam {
  /**
   * The ring argument of AutoMovieHumanLegAnkleSeam.residual. The ring's radius
   * about a centre at each leg phase, less the leg law's own radius there: the
   * ring's difference from the law.
   *
   * @param ring The ring in the section plane, canonical, `[x, z]`.
   * @param centre The law's own centre at the ring.
   * @param radii The law's radii at the leg's phases.
   */
  export type ResidualRing = readonly [number, number][];

  /**
   * The centre argument of AutoMovieHumanLegAnkleSeam.residual. The ring's
   * radius about a centre at each leg phase, less the leg law's own radius
   * there: the ring's difference from the law.
   *
   * @param ring The ring in the section plane, canonical, `[x, z]`.
   * @param centre The law's own centre at the ring.
   * @param radii The law's radii at the leg's phases.
   */
  export type ResidualCentre = readonly [number, number];

  /**
   * The ring argument of AutoMovieHumanLegAnkleSeam.lift. A ring's height off
   * its plane at each canonical phase, read off its nearest edge.
   *
   * @param ring The ring in the plane, `[x, z]`.
   * @param centre The centre the phases are read about.
   * @param world The ring's world points, one per ring point.
   * @param level Height of the plane.
   */
  export type LiftRing = readonly [number, number][];

  /**
   * The centre argument of AutoMovieHumanLegAnkleSeam.lift. A ring's height off
   * its plane at each canonical phase, read off its nearest edge.
   *
   * @param ring The ring in the plane, `[x, z]`.
   * @param centre The centre the phases are read about.
   * @param world The ring's world points, one per ring point.
   * @param level Height of the plane.
   */
  export type LiftCentre = readonly [number, number];
}
