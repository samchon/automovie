/**
 *
 * The indoor air an envelope is analysed against.
 *
 * The temperature sets the interior side of the heat-flow difference, and the
 * humidity sets the dew point interior surfaces are judged against. A humidity
 * of exactly 0 has no dew point, so the moisture metrics become gaps.
 *
 * @evidence contracts/common.md#principled-implementation Dry-bulb temperature and relative humidity are the two inputs of the Magnus dew point and the indoor boundary of the steady-state network.
 * @evidence contracts/common.md#clear-and-simple-design Two fields with no outdoor counterpart, because the exterior condition comes from the environment instant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero humidity is an accepted input that yields gaps rather than an error, and no humidity is ever substituted for it.
 * @evidence contracts/common.md#meaningful-documentation States the Celsius and fraction units, the inclusive humidity range, and the zero-humidity gap case.
 * @evidenceExclude contracts/performance.md#cost-and-resources Two numbers read once per envelope study. Read once per study; the single dew point derived from it is shared by every assembly's condensation margin. Two numbers owned by the envelope request for one study.
 * @author Samchon
 */
export interface IAutoMovieIndoorCondition {
  /** Dry-bulb air temperature in degrees Celsius; finite. */
  airTemperature: number;

  /** Relative humidity as a `[0, 1]` fraction, both ends included. */
  relativeHumidity: number;
}
