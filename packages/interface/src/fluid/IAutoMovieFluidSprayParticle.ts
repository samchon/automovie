import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One live decorative spray particle.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `IAutoMovieFluidSprayParticle` as the portable data boundary for the interior fluid flow spray requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidSprayParticle` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidSprayParticle {
  /**
   * Emitter that spawned it.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `spray` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `spray` for the interior space water feature fluid domain system contract.
   */
  spray: string;

  /**
   * Stable zero-based spawn identity within that emitter.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `index` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `index` for the interior space water feature fluid domain system contract.
   */
  index: number;

  /**
   * World position at the sampled step.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `position` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `position` for the interior space water feature fluid domain system contract.
   */
  position: IAutoMovieVector3;

  /**
   * World billboard size in metres.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `size` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `size` for the interior space water feature fluid domain system contract.
   */
  size: number;

  /**
   * Normalized lifetime progress in `[0, 1)`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `ageRatio` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `ageRatio` for the interior space water feature fluid domain system contract.
   */
  ageRatio: number;
}
