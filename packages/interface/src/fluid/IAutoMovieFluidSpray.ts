import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One bounded decorative spray emitter outside the conserved depth field.
 *
 * Seed and spawn index determine launch jitter; the supplied state/time and
 * camera distance determine live positions and population. Samples retain no
 * earlier result, and distance thinning precedes maxParticles.
 *
 * Particle i launches at i / rate domain-clock seconds and follows a ballistic
 * arc under solver.gravity. Every live particle uses the nozzle height from the
 * currently supplied cell free surface, rather than retained launch-time water
 * history. Particles collide with neither bed, walls nor solid cells;
 * validation requires a nonsolid in-grid emitter cell and a nonblank id unique
 * among the domain's sprays.
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
   * Symmetric per-axis jitter amplitude in [0, 1], added to the normalized
   * launch direction before another normalization. Zero removes jitter;
   * derived-direction degeneracies are not independently admitted.
   */
  spread: number;

  /** World billboard size of one particle in metres; finite and positive. */
  size: number;

  /** Deterministic seed; any safe integer. */
  seed: number;

  /**
   * Hard live-particle cap per sample, a safe integer within [1, 4096], applied
   * after distance thinning and retaining the newest survivors.
   */
  maxParticles: number;

  /**
   * Strictly positive finite metres per thinning level. Spawn indices must be
   * divisible by 1 + floor(max(cameraDistance, 0) / lodDistance); distances
   * below lodDistance thin nothing.
   */
  lodDistance: number;
}
