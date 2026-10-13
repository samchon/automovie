import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One moment of sun and sky, exactly as the production declares it.
 *
 * The sun direction is an input, not a computation. A repository that derived
 * it from a place and a calendar would be shipping named locations and climate
 * data as content; what the product owes is the contract and the solvers, so a
 * production states the direction and the illuminance it wants answered and
 * keeps its own sources.
 */
export interface IAutoMovieEnvironmentInstant {
  /** Stable instant identity within the context. */
  id: string;

  /** Open label such as `summer-solstice-1400` or `overcast-morning`. */
  label: string;

  /** Ordering key in seconds from the production's own epoch; finite. */
  time: number;

  /** World direction from the site toward the sun; non-zero. */
  sun: IAutoMovieVector3;

  /**
   * Illuminance on a surface facing the sun directly, in lux; at or above zero.
   * A sun at or below the horizon must declare zero, because a source under the
   * ground plane delivers no beam.
   */
  directNormalIlluminance: number;

  /** Diffuse sky illuminance on an unobstructed horizontal plane, in lux. */
  diffuseHorizontalIlluminance: number;

  /** Outdoor dry-bulb air temperature in degrees Celsius, or null. */
  outdoorAirTemperature: number | null;

  /** Outdoor relative humidity as a `[0, 1]` fraction, or null. */
  outdoorRelativeHumidity: number | null;
}
