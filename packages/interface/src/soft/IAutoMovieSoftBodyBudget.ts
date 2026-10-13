/**
 * The bounded cost a soft-body domain adds to a shot, for the builder report.
 *
 * Every field is derived from the domain record alone, so a production can be
 * refused for an unaffordable panel before a single step is integrated.
 */
export interface IAutoMovieSoftBodyBudget {
  /** Identity of the measured domain. */
  domain: string;

  /**
   * Lattice particles, `columns * rows`.
   *
   * The derived surface carries one vertex per particle, so this is also the
   * drawn vertex count a render budget attributes device memory to.
   */
  particles: number;

  /**
   * Triangles the derived surface draws: two per lattice quad.
   *
   * It happens to equal {@link shear}, because a quad carries two diagonals and
   * two triangles alike. They are separate statements about separate costs —
   * one is what the solver projects, the other is what the GPU rasterizes — and
   * a consumer reading the constraint count as a triangle count would be right
   * by coincidence and wrong the moment either side changes.
   */
  triangles: number;

  /** Row and column distance constraints. */
  structural: number;

  /** Diagonal distance constraints. */
  shear: number;

  /** Second-neighbour distance constraints. */
  bend: number;

  /** Declared colliders. */
  colliders: number;

  /** Bytes one state occupies as 64-bit reals: `8 * 6 * particles`. */
  stateBytes: number;

  /** Highest absolute step a sample may integrate to. */
  maxSteps: number;

  /** Constraint gathers a worst-case seek costs. */
  worstCaseGathers: number;

  /**
   * Travel number `dt · referenceSpeed / shortestRestLength`. At most `1`, or a
   * particle can cross a constraint or a collider inside one step.
   */
  travel: number;
}
