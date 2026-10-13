import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One bounded decorative spray emitter: the mist of a fountain jet or the
 * curtain at the foot of a water wall.
 *
 * Spray is deterministic from `seed` and the particle index alone, so seeking
 * to a time reproduces the same particles regardless of what was sampled
 * before, and it is bounded twice: by `maxParticles` and by distance thinning.
 *
 * Particle `i` launches at `i / rate` seconds from the free surface above the
 * emitter cell's centre and follows a ballistic arc under `solver.gravity`. It
 * does not collide with the bed, the walls, or solid cells. The cell must lie
 * inside the lattice and not be solid.
 *
 * @evidence contracts/common.md#principled-implementation Counter-based seeded sampling: launch time, jittered direction and ballistic position are functions of `seed` and spawn index, so a seek evaluates only the indices alive in `(time - lifetime, time]` instead of replaying history; particles do not collide with the bed or walls.
 * @evidence contracts/common.md#clear-and-simple-design One emitter per record with its rate, launch, appearance and two bounds side by side, sited by cell so its nozzle height follows the solved free surface without a separate height field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No emitter is special-cased; the cap keeps the newest particles and LOD thinning is a deterministic index stride, both computed in `sampleFluidSpray` rather than left to a renderer.
 * @evidence contracts/common.md#meaningful-documentation States each field's unit and bound, the launch schedule and origin, that `spread` jitters the normalized direction, the thinning rule, the cap behaviour, and that particles pass through geometry.
 * @author Samchon
 */
export interface IAutoMovieFluidSpray {
  /** Stable emitter identity within the domain. */
  id: string;

  /** Cell column the emitter sits in; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row the emitter sits in; `0 <= row < grid.rows`. */
  row: number;

  /** Particles spawned per second; strictly positive. */
  rate: number;

  /** Particle lifetime in seconds; strictly positive. */
  lifetime: number;

  /** Launch speed in m/s along {@link direction}; `>= 0`. */
  speed: number;

  /** Launch direction; finite, not the zero vector, and need not be unit. */
  direction: IAutoMovieVector3;

  /**
   * Symmetric per-axis jitter added to the normalized launch direction, in the
   * closed range `[0, 1]`; the jittered vector is normalized again. `0` emits a
   * perfectly collimated jet.
   */
  spread: number;

  /** World billboard size of one particle in metres; strictly positive. */
  size: number;

  /** Deterministic seed; any safe integer. */
  seed: number;

  /**
   * Hard cap on simultaneously live particles, a safe integer in `[1, 4096]`.
   * When more are alive, the newest are kept.
   */
  maxParticles: number;

  /**
   * Camera distance in metres per thinning level; strictly positive. A sample
   * keeps every `1 + floor(cameraDistance / lodDistance)`-th spawn index, so
   * nothing is thinned closer than this distance.
   */
  lodDistance: number;
}
