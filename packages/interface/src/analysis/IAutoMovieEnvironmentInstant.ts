import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One moment of sun and sky, exactly as the production declares it.
 *
 * The production supplies sun direction and illuminance from its own source. Current analysis consumes those values; this repository implements no solar-position derivation from coordinates and calendar time.
 *
 * @evidence contracts/common.md#principled-implementation Declared sun direction and illuminances that `validateAutoMovieEnvironmentContext` checks: finite non-zero sun, non-negative finite illuminances, null or finite temperature, null or `[0, 1]` humidity, and a zero direct beam whenever the normalized sun has a non-positive dot product with the ground's up.
 * @evidence contracts/common.md#clear-and-simple-design Scalar fields hold declared sun, sky and outdoor air quantities, nullable where a study does not need them; outdoorRelativeHumidity currently has validation but no analysis consumer, so it promises no humidity-dependent result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No solar position algorithm or weather default exists; an instant without outdoor air temperature makes the envelope study return `not-run` instead of assuming a value, and the unread humidity field is stated as unread.
 * @evidence contracts/common.md#meaningful-documentation States why the sun is declared, the units and ranges of every quantity, the horizon rule and its reference, the null meaning of both outdoor fields, and which solver reads which field.
 * @author Samchon
 */
export interface IAutoMovieEnvironmentInstant {
  /** Non-blank stable instant identity, unique within the context. */
  id: string;

  /**
   * Non-blank open label such as `summer-solstice-1400` or `overcast-morning`.
   */
  label: string;

  /** Ordering key in seconds from the production's own epoch; finite. */
  time: number;

  /** World direction from the site toward the sun; finite and non-zero. */
  sun: IAutoMovieVector3;

  /**
   * Illuminance on a surface facing the sun directly, in lux; at or above zero. A sun at or below the horizon must declare zero, because a source under the ground plane delivers no beam. The horizon is judged against the context ground's up direction.
   */
  directNormalIlluminance: number;

  /**
   * Diffuse sky illuminance on an unobstructed horizontal plane, in lux; at or above zero.
   */
  diffuseHorizontalIlluminance: number;

  /**
   * Outdoor dry-bulb air temperature in degrees Celsius, or null. The envelope study returns `not-run` for an instant that leaves it null.
   */
  outdoorAirTemperature: number | null;

  /**
   * Outdoor relative humidity as a `[0, 1]` fraction, or null. No solver reads it yet; the envelope study takes indoor humidity from its own request.
   */
  outdoorRelativeHumidity: number | null;
}
