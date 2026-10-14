/**
 * The indoor air an envelope is analysed against.
 *
 * The temperature sets the interior side of the heat-flow difference, and the
 * humidity sets the dew point interior surfaces are judged against. A humidity
 * of exactly 0 has no dew point, so the moisture metrics become gaps.
 *
 * @evidence contracts/common.md#principled-implementation Dry-bulb temperature and relative humidity are the two inputs of the Magnus dew point and the indoor boundary condition of the steady-state network, so no further property of the air is needed.
 * @evidence contracts/common.md#clear-and-simple-design A separate record groups the two quantities that describe one body of air, keeping them apart from the exterior condition, which comes from the environment context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero humidity is accepted and yields gaps rather than an error or a substituted humidity, because dry air is a real state with no dew point.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what each value drives and the zero-humidity outcome, and each property states its unit and range with both ends of the humidity range included.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record of two numbers with no runtime code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record type with no runtime code; the one dew point derived from it is shared by every assembly's condensation margin.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers owned by the envelope request; nothing is retained from them.
 * @author Samchon
 */
export interface IAutoMovieIndoorCondition {
  /** Dry-bulb air temperature in degrees Celsius; finite. */
  airTemperature: number;

  /** Relative humidity as a `[0, 1]` fraction, both ends included. */
  relativeHumidity: number;
}
