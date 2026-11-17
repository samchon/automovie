import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A reader of every step of one soft-body solve, so a caller that needs the
 * whole trajectory (a performance read by film seconds) solves once instead
 * of replaying from step 0 for each step it reads.
 *
 * @evidence contracts/development/design.md#principled-representation One call per completed absolute step with that step's positions, velocities and the force each held particle bears.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one callback the trajectory's consumers read; the solver's result stays the final state as before.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The buffers are the solver's working arrays, lent for the call: a reader copies what it keeps, so the solve allocates nothing per step for a reader that keeps nothing.
 * @evidence contracts/development/common.md#meaningful-documentation States when it is called, the frames and units, the lending rule and how a held particle's force is read.
 */
export interface IAutoMovieSoftBodyObserver {
  /**
   * Read one completed step.
   *
   * @param step The absolute step just completed, from 1; step 0 is the rest before any integration and is not reported.
   * @param positions Every particle's world position, metres, row-major `[x, y, z, ...]`; lent for the call.
   * @param velocities Every particle's velocity, metres per second, in the same layout; a held particle reads zero; lent for the call.
   * @param loads The force each held particle bears from the constraints that tie it to the rest of the body, newtons, world frame, by particle: the pull a hand holding it feels. Read from the compliant solver's multipliers (force = lambda times the constraint gradient over the step squared); empty when the domain declares no compliance, since the relaxation weights of the plain solver are not forces.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States completed-step timing, absolute indexing, world units, borrowed buffers, held-particle velocity and the force map's meaning and empty case.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation An observer method signature; each observer owns what it computes from a step.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No observer body is declared here.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature performs no observation or computation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The observer implementation owns its per-step cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature owns no saved trajectory or coordinated reads.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature retains no buffers; implementations must copy any borrowed data they keep.
   */
  step(
    step: number,
    positions: Float64Array<ArrayBufferLike>,
    velocities: Float64Array<ArrayBufferLike>,
    loads: ReadonlyMap<number, IAutoMovieVector3>,
  ): void;
}
