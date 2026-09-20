import { IAutoMovieFluidSprayParticle } from "./IAutoMovieFluidSprayParticle";

/**
 * One bounded decorative spray sample at an absolute step.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `IAutoMovieFluidSpraySample` as the portable data boundary for the interior fluid flow spray requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidSpraySample` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidSpraySample {
  /**
   * Absolute integer step index sampled.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `step` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `step` for the interior space water feature fluid domain system contract.
   */
  step: number;

  /**
   * Absolute domain-clock second sampled.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `time` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `time` for the interior space water feature fluid domain system contract.
   */
  time: number;

  /**
   * Live particles after distance thinning and the hard per-emitter cap.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-flow-spray Exposes `particles` as the portable data boundary for the interior fluid flow spray requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `particles` for the interior space water feature fluid domain system contract.
   */
  particles: IAutoMovieFluidSprayParticle[];
}
