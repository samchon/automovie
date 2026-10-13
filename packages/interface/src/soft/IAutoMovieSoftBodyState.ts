/**
 * The complete state of a soft-body domain at one **absolute** step.
 *
 * Absolute is the whole contract. A state is a pure function of the domain
 * record, the named state applied and the integer step index, so seeking a shot
 * backwards, forwards, or out of order yields exactly the same numbers as
 * playing it straight through; nothing accumulates in a runtime object between
 * frames.
 *
 * Particle arrays are flat and row-major: particle `k = row * columns + column`
 * occupies `[3k, 3k + 1, 3k + 2]`.
 */
export interface IAutoMovieSoftBodyState {
  /** Identity of the domain this state belongs to. */
  domain: string;

  /** Named state whose anchor poses were applied, or `null` for the default. */
  state: string | null;

  /** Absolute integer step index, `0` being the authored rest configuration. */
  step: number;

  /** Absolute domain-clock second, exactly `step * solver.fixedStepSeconds`. */
  time: number;

  /** World particle positions `[x, y, z, ...]` in metres, row-major. */
  positions: number[];

  /** World particle velocities `[x, y, z, ...]` in m/s, row-major. */
  velocities: number[];

  /**
   * Fastest particle speed in this state, in m/s.
   *
   * Measured evidence against {@link IAutoMovieSoftSolver.referenceSpeed}: the
   * declared budget is what the travel condition was checked against, and this
   * is what actually happened, so a reviewer can see whether the declaration
   * held instead of taking it on trust.
   */
  maxSpeed: number;

  /**
   * Largest relative stretch of any structural constraint, `|d − L| / L`.
   *
   * `0` is inextensible. It is the honest measure of what the declared
   * stiffness and iteration count bought, since a position-based solver
   * approaches inextensibility rather than enforcing it.
   */
  maxStrain: number;

  /**
   * Particle-collider resolutions applied during the last integrated step.
   *
   * `0` at step `0`, where nothing has been integrated yet — which is not the
   * same claim as a panel resting clear of everything around it. A rest
   * configuration touching a floor still reports no contact, because no step
   * has asked it to.
   */
  contacts: number;
}
