/**
 * Where the sun stands in an observer's sky at one instant, after atmospheric
 * refraction.
 *
 * `solveAutoMovieSunPosition` produces it from a site and a UTC instant, and
 * `autoMovieSunDirection` turns it into a world vector through an environment
 * context's north and ground. Angles are topocentric: measured from the
 * observer's position on the Earth's surface, not from the Earth's centre.
 */
export interface IAutoMovieSunPosition {
  /**
   * Angle from the local vertical to the sun's centre, in degrees; from 0 to
   * 180. Equal to `90 - elevation`.
   */
  zenith: number;

  /**
   * Compass bearing of the sun, in degrees eastward from north; at or above 0
   * and below 360. North is 0, east 90, south 180, west 270.
   */
  azimuth: number;

  /**
   * Angle of the sun's centre above the horizon, in degrees; from -90 to 90.
   * Negative below the horizon. Refraction raises it only when the unrefracted
   * elevation is at or above -0.8333 degrees, so a sun well below the horizon
   * reports its geometric elevation.
   */
  elevation: number;
}
