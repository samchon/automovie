/**
 * The indoor air an envelope is analysed against.
 *
 * The temperature sets the interior side of the heat-flow difference, and the
 * humidity sets the dew point interior surfaces are judged against. A humidity
 * of exactly 0 has no dew point, so the moisture metrics become gaps.
 *
 * @author Samchon
 */
export interface IAutoMovieIndoorCondition {
  /** Dry-bulb air temperature in degrees Celsius; finite. */
  airTemperature: number;

  /** Relative humidity as a `[0, 1]` fraction, both ends included. */
  relativeHumidity: number;
}
