import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A reader of every step of one soft-body solve, so a caller that needs the
 * whole trajectory (a performance read by film seconds) solves once instead of
 * replaying from step 0 for each step it reads.
 */
export interface IAutoMovieSoftBodyObserver {
  /**
   * Read one completed step.
   *
   * @param step The absolute step just completed, from 1; step 0 is the rest
   *   before any integration and is not reported.
   * @param positions Every particle's world position, metres, row-major `[x, y,
   *   z, ...]`; lent for the call.
   * @param velocities Every particle's velocity, metres per second, in the same
   *   layout; a held particle reads zero; lent for the call.
   * @param loads The force each held particle bears from the constraints that
   *   tie it to the rest of the body, newtons, world frame, by particle: the
   *   pull a hand holding it feels. Read from the compliant solver's
   *   multipliers (force = lambda times the constraint gradient over the step
   *   squared); empty when the domain declares no compliance, since the
   *   relaxation weights of the plain solver are not forces.
   */
  step(
    step: number,
    positions: Float64Array<ArrayBufferLike>,
    velocities: Float64Array<ArrayBufferLike>,
    loads: ReadonlyMap<number, IAutoMovieVector3>,
  ): void;
}
