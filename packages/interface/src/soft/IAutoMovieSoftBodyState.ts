/**
 * The complete state of a soft-body domain at one **absolute** step.
 *
 * Static evaluation restarts from the domain and selected named state before integrating to the absolute step. Boundary-aware evaluation additionally consumes a complete resolved moving-anchor/capsule history from zero through that step; changing the history changes the trajectory. Replaying the same complete input basis does not depend on a mutable playback cursor, and the boundary-aware path currently has test callers rather than a wired production/viewer host.
 *
 * Particle arrays are flat and row-major: particle `k = row * columns + column` occupies `[3k, 3k + 1, 3k + 2]`.
 *
 * @evidence contracts/common.md#principled-implementation The solver restarts from the selected rest configuration and integrates to an absolute integer step, returning flat position/velocity arrays plus speed, structural strain and last-step projection counts.
 * @evidence contracts/common.md#clear-and-simple-design The result retains its domain and named state with the fixed-clock time, allowing independently sought frames to be compared without hidden accumulated state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts maxSpeed is computed rather than capped to referenceSpeed; contacts counts applied projections, not unique contacts or proof that all overlapping colliders are satisfied. Integrated arrays receive a finite check, but final time/speed/strain arithmetic has no separate result check and is not an all-finite-input measurement guarantee.
 * @evidence contracts/common.md#meaningful-documentation Comments give row-major component indexing, world units, exact step-time relation and the zero-step meaning of contacts.
 */
export interface IAutoMovieSoftBodyState {
  /** Identity of the domain this state belongs to. */
  domain: string;

  /** Named state whose anchor poses were applied, or `null` for the default. */
  state: string | null;

  /** Absolute integer step index; `0` includes static/named anchor overrides and any supplied boundary-zero targets of the rest mesh. */
  step: number;

  /** Absolute domain-clock second, exactly `step * solver.fixedStepSeconds`. */
  time: number;

  /** World particle positions `[x, y, z, ...]` in metres, row-major. */
  positions: number[];

  /** World particle velocities `[x, y, z, ...]` in m/s, row-major. */
  velocities: number[];

  /**
   * Maximum of direct-square particle speed calculations in this state, in m/s; finite velocity components can still overflow that norm.
   *
   * Measured evidence against {@link IAutoMovieSoftSolver.referenceSpeed}: the declared budget is what the travel condition was checked against, and this is what actually happened, so a reviewer can see whether the declaration held instead of taking it on trust.
   */
  maxSpeed: number;

  /**
   * Maximum accumulated structural strain, computed as `|d − L| / L` from direct-square particle distances.
   *
   * With finite representable distance and strain arithmetic, `0` means the structural distances equal their authored rest lengths in this state. There is no separate finite-result gate here: a NaN comparison does not update the initially zero maximum. This field does not establish material inextensibility, measure diagonal/bend strain or certify a later state.
   */
  maxStrain: number;

  /**
   * Particle-collider resolutions applied during the last integrated step.
   *
   * Zero at step zero because no integration step has applied a projection. This does not establish that the rest mesh is clear of every collider.
   */
  contacts: number;
}
