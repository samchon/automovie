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
 * @evidence contracts/common.md#principled-implementation Sun direction and both illuminances are declared inputs, not derived from a place and date; validation refuses a positive direct normal illuminance whenever the normalized sun direction has a non-positive dot product with the context ground's up direction.
 * @evidence contracts/common.md#clear-and-simple-design One flat record per moment, with optional outdoor air values as nulls instead of a separate climate record, lets daylight and envelope studies read the same instant by id.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No location, calendar or climate table fills a missing value: a null outdoor temperature makes the envelope study return `not-run`, and `outdoorRelativeHumidity` is validated but read by no solver today.
 * @evidence contracts/common.md#meaningful-documentation States the unit of every quantity, the horizon rule for direct illuminance, the time ordering key, the humidity fraction range, and what null means and which solvers read each optional value.
 */
export interface IAutoMovieEnvironmentInstant {
  /** Stable instant identity, unique within the context. */
  id: string;

  /**
   * Non-blank open label such as `summer-solstice-1400` or `overcast-morning`.
   */
  label: string;

  /** Ordering key in seconds from the production's own epoch; finite. */
  time: number;

  /** World direction from the site toward the sun; non-zero. */
  sun: IAutoMovieVector3;

  /**
   * Illuminance on a surface facing the sun directly, in lux; at or above zero.
   * A sun at or below the horizon must declare zero, because a source under the
   * ground plane delivers no beam. The horizon is judged against the context
   * ground's up direction.
   */
  directNormalIlluminance: number;

  /**
   * Diffuse sky illuminance on an unobstructed horizontal plane, in lux; at or
   * above zero.
   */
  diffuseHorizontalIlluminance: number;

  /**
   * Outdoor dry-bulb air temperature in degrees Celsius, or null. The envelope
   * study returns `not-run` for an instant that leaves it null.
   */
  outdoorAirTemperature: number | null;

  /**
   * Outdoor relative humidity as a `[0, 1]` fraction, or null. No solver reads
   * it yet; the envelope study takes indoor humidity from its own request.
   */
  outdoorRelativeHumidity: number | null;
}
