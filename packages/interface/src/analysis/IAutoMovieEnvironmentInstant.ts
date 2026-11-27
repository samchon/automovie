import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One moment of sun and sky, exactly as the production declares it.
 *
 * The production derives the sun direction from the site and the story's time
 * with `solveSunPosition` and `sunDirection`, so the instant
 * and the staged sun light share one solar position. Illuminance stays declared
 * by the production from its own source; no sky model computes it.
 */
export interface IAutoMovieEnvironmentInstant {
  /** Non-blank stable instant identity, unique within the context. */
  id: string;

  /** Non-blank open label such as `summer-solstice-1400` or `overcast-morning`. */
  label: string;

  /** Ordering key in seconds from the production's own epoch; finite. */
  time: number;

  /**
   * World direction from the site toward the sun; finite and non-zero.
   * `sunDirection` computes it from a solved sun position.
   */
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
