import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One bounded decorative spray emitter: the mist of a fountain jet or the
 * curtain at the foot of a water wall.
 *
 * Spray is deterministic from `seed` and the particle index alone, so seeking
 * to a time reproduces the same particles regardless of what was sampled
 * before, and it is bounded twice: by distance thinning and then by
 * `maxParticles`.
 *
 * Particle `i` launches at `i / rate` domain-clock seconds and follows a
 * ballistic arc under `solver.gravity` from a nozzle above the emitter cell's
 * centre. The nozzle stands at that cell's free surface in the sampled state,
 * so every live arc rises and falls with the water. Particles do not collide
 * with the bed, the walls, or solid cells. `validateFluidDomain` requires the
 * cell to lie inside the lattice and not be solid, and the `id` to be non-blank
 * and unique among the domain's sprays.
 *
 * @evidence contracts/common.md#principled-implementation `sampleFluidSpray` derives each particle's direction from `seededValue(seed, index, axis salt)` and its position from `p0 + d * speed * age - g * age² / 2 * y`, so a sample is a pure function of the emitter, the solved state and the camera distance.
 * @evidence contracts/common.md#clear-and-simple-design Spray is an emitter description with no particle state, kept beside the conserved field on the domain but outside its mass balance, so the solver never reads it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thinning and the hard cap are applied in the engine sample rather than left to a renderer, so every renderer draws the same population; the remaining limits are that particles ignore geometry and that a jitter cancelling the axis exactly would yield a non-finite direction, which no input is checked against.
 * @evidence contracts/common.md#meaningful-documentation States the determinism, both bounds and their order, the launch time, the nozzle position and that it follows the sampled surface, the absent collisions, and the validation rules; members give units, ranges and how each value shapes the sample.
 * @author Samchon
 */
export interface IAutoMovieFluidSpray {
  /** Stable emitter identity within the domain. */
  id: string;

  /** Cell column the emitter sits in; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row the emitter sits in; `0 <= row < grid.rows`. */
  row: number;

  /** Particles spawned per second; finite and strictly positive. */
  rate: number;

  /** Particle lifetime in seconds; finite and strictly positive. */
  lifetime: number;

  /** Launch speed in m/s along {@link direction}; finite and `>= 0`. */
  speed: number;

  /** Launch direction; finite, not the zero vector, and need not be unit. */
  direction: IAutoMovieVector3;

  /**
   * Symmetric per-axis jitter added to the normalized launch direction, in the
   * closed range `[0, 1]`; the jittered vector is normalized again. `0` emits a
   * perfectly collimated jet.
   */
  spread: number;

  /** World billboard size of one particle in metres; finite and positive. */
  size: number;

  /** Deterministic seed; any safe integer. */
  seed: number;

  /**
   * Hard cap on live particles kept by one sample, a safe integer in
   * `[1, 4096]`, applied after distance thinning. When more survive thinning,
   * the newest are kept.
   */
  maxParticles: number;

  /**
   * Camera distance in metres per thinning level; finite and strictly
   * positive. A sample keeps only spawn indices divisible by
   * `1 + floor(cameraDistance / lodDistance)`, so nothing is thinned closer
   * than this distance.
   */
  lodDistance: number;
}
