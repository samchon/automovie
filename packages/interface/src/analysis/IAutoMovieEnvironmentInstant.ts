import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One moment of sun and sky, exactly as the production declares it.
 *
 * The sun direction is an input, not a computation. A repository that derived
 * it from a place and a calendar would be shipping named locations and climate
 * data as content; what the product owes is the contract and the solvers, so a
 * production states the direction and the illuminance it wants answered and
 * keeps its own sources.
 *
 * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-time-sampling Represents one explicitly timed environment sample rather than an inferred climate state.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-sampling-claims Carries the authored environment state evaluated at one declared production instant.
 */
export interface IAutoMovieEnvironmentInstant {
  /**
   * Stable instant identity within the context.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-time-sampling Identifies the exact authored environment sample on the production timeline.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-sampling-claims Gives each sampled environment state a stable identity.
   */
  id: string;
  /**
   * Open label such as `summer-solstice-1400` or `overcast-morning`.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-time-sampling Retains the production's authored label for the sampled environment alternative.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-sampling-claims Names the sampled state without inventing a location or climate catalogue.
   */
  label: string;
  /**
   * Ordering key in seconds from the production's own epoch; finite.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-time-sampling Places this environment state on the production's explicit time basis.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-sampling-claims Supplies the deterministic ordering and lookup key for environment sampling.
   */
  time: number;
  /**
   * World direction from the site toward the sun; non-zero.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-declared-sun Carries the production-declared sun direction without implying an unrecorded location or solar calculation.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `sun` for the clv environment image spatial variation system contract.
   */
  sun: IAutoMovieVector3;
  /**
   * Illuminance on a surface facing the sun directly, in lux; at or above zero.
   * A sun at or below the horizon must declare zero, because a source under the
   * ground plane delivers no beam.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-declared-sun Carries the declared direct solar illuminance used with the authored sun direction.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `directNormalIlluminance` for the clv environment image spatial variation system contract.
   */
  directNormalIlluminance: number;
  /**
   * Diffuse sky illuminance on an unobstructed horizontal plane, in lux.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-declared-sun Separates the declared diffuse sky contribution from direct solar illuminance.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `diffuseHorizontalIlluminance` for the clv environment image spatial variation system contract.
   */
  diffuseHorizontalIlluminance: number;
  /**
   * Outdoor dry-bulb air temperature in degrees Celsius, or null.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-spatial-variation Carries the production's local outdoor-air condition as an optional environment state.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `outdoorAirTemperature` for the clv environment image spatial variation system contract.
   */
  outdoorAirTemperature: number | null;
  /**
   * Outdoor relative humidity as a `[0, 1]` fraction, or null.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-spatial-variation Carries the production's local humidity condition without promoting a global climate default.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `outdoorRelativeHumidity` for the clv environment image spatial variation system contract.
   */
  outdoorRelativeHumidity: number | null;
}
