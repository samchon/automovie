/**
 * The bounded cost a soft-body domain adds to a shot, for the builder report.
 *
 * Every field is derived from the domain record alone, so a production can be refused for an unaffordable panel before a single step is integrated.
 *
 * @evidence contracts/common.md#principled-implementation softBodyBudget counts row/column, diagonal and second-neighbour constraints from lattice dimensions, then derives two gathers per constraint per iteration and step; travel uses the shortest authored structural rest edge, excluding diagonal and second-neighbour lengths.
 * @evidence contracts/common.md#clear-and-simple-design The report separates raster triangles, solver constraints and declared seek work so equal counts do not imply equal responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts stateBytes counts six Float64 components per particle only; it excludes working buffers, JavaScript array overhead and device allocations and is not total process memory.
 * @evidence contracts/common.md#meaningful-documentation Fields identify counts, bytes, maximum absolute step and the dimensionless travel admission estimate.
 */
export interface IAutoMovieSoftBodyBudget {
  /** Identity of the measured domain. */
  domain: string;

  /**
   * Lattice particles, `columns * rows`.
   *
   * The derived surface carries one vertex per particle, so this is also the drawn vertex count a render budget attributes device memory to.
   */
  particles: number;

  /**
   * Triangles the derived surface draws: two per lattice quad.
   *
   * It happens to equal {@link shear}, because a quad carries two diagonals and two triangles alike. They are separate statements about separate costs; one is what the solver projects, the other is what the GPU rasterizes; and a consumer reading the constraint count as a triangle count would be right by coincidence and wrong the moment either side changes.
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

  /** Raw position and velocity bytes as 64-bit reals: `8 * 6 * particles`; excludes allocation overhead and working buffers. */
  stateBytes: number;

  /** Highest absolute step a sample may integrate to. */
  maxSteps: number;

  /** Constraint gathers a worst-case seek costs. */
  worstCaseGathers: number;

  /**
   * Authored travel estimate `dt · referenceSpeed / shortestStructuralRestLength`, required to be at most `1` by domain admission. The shortest-edge Infinity sentinel yields `0`, including no-edge lattices and direct-square distance overflow. It uses declared speed and lattice spacing rather than observed motion or collider thickness, so an admitted ratio does not certify continuous collision avoidance.
   */
  travel: number;
}
