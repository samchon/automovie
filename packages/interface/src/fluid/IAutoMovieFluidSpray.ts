import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One bounded decorative spray emitter: the mist of a fountain jet or the
 * curtain at the foot of a water wall.
 *
 * Spray is deterministic from `seed` and the particle index alone, so seeking
 * to a time reproduces the same particles regardless of what was sampled
 * before, and it is bounded twice: by `maxParticles` and by distance thinning.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `IAutoMovieFluidSpray` as the portable data boundary for the interior fluid flow spray requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidSpray` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidSpray {
  /**
   * Stable emitter identity within the domain.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `id` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `id` for the interior space water feature fluid domain system contract.
   */
  id: string;

  /**
   * Cell column the emitter sits in; `0 <= column < grid.columns`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `column` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `column` for the interior space water feature fluid domain system contract.
   */
  column: number;

  /**
   * Cell row the emitter sits in; `0 <= row < grid.rows`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `row` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `row` for the interior space water feature fluid domain system contract.
   */
  row: number;

  /**
   * Particles spawned per second; strictly positive.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `rate` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `rate` for the interior space water feature fluid domain system contract.
   */
  rate: number;

  /**
   * Particle lifetime in seconds; strictly positive.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `lifetime` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `lifetime` for the interior space water feature fluid domain system contract.
   */
  lifetime: number;

  /**
   * Launch speed in m/s along {@link direction}; `>= 0`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `speed` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `speed` for the interior space water feature fluid domain system contract.
   */
  speed: number;

  /**
   * Launch direction; must not be the zero vector and need not be unit.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `direction` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `direction` for the interior space water feature fluid domain system contract.
   */
  direction: IAutoMovieVector3;

  /**
   * Symmetric per-axis jitter added to the normalized launch direction, in the
   * closed range `[0, 1]`. `0` emits a perfectly collimated jet.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `spread` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `spread` for the interior space water feature fluid domain system contract.
   */
  spread: number;

  /**
   * World billboard size of one particle in metres; strictly positive.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `size` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `size` for the interior space water feature fluid domain system contract.
   */
  size: number;

  /**
   * Deterministic seed; any safe integer.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `seed` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `seed` for the interior space water feature fluid domain system contract.
   */
  seed: number;

  /**
   * Hard cap on simultaneously live particles; a positive integer.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `maxParticles` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `maxParticles` for the interior space water feature fluid domain system contract.
   */
  maxParticles: number;

  /**
   * Camera distance in metres past which the live set is deterministically
   * thinned; strictly positive.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `lodDistance` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `lodDistance` for the interior space water feature fluid domain system contract.
   */
  lodDistance: number;
}
