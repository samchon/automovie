/** The indoor air an envelope is analysed against. */
export interface IAutoMovieIndoorCondition {
  /** Dry-bulb air temperature in degrees Celsius. */
  airTemperature: number;
  /** Relative humidity as a `[0, 1]` fraction. */
  relativeHumidity: number;
}
