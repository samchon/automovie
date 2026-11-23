/**
 * Data contracts of `solveAutoMovieSunPosition`, which places the sun in the
 * sky of a site at a UTC instant.
 */
export namespace IAutoMovieSolveSunPosition {
  /**
   * The observer's site and the instant to solve.
   *
   * `solveAutoMovieSunPosition` refuses a latitude outside `[-90, 90]`, a
   * non-finite longitude or elevation, a calendar field that is not an integer
   * in its range, a non-positive pressure and a temperature at or below
   * absolute zero, by throwing an error that names the field.
   */
  export type IProps = {
    /** Geodetic latitude in degrees, north positive; within `[-90, 90]`. */
    latitude: number;

    /** Longitude in degrees, east positive; finite. */
    longitude: number;

    /** The instant, in Coordinated Universal Time. */
    utc: IUtc;

    /**
     * Observer height above mean sea level in metres; finite. Read only by the
     * parallax correction. Defaults to 0.
     */
    elevation?: number;

    /**
     * Mean annual local air pressure in millibars; finite and above zero. Read
     * only by the refraction correction. Defaults to 1013.25, the standard
     * atmosphere at sea level.
     */
    pressure?: number;

    /**
     * Mean annual local air temperature in degrees Celsius; finite and above
     * -273.15. Read only by the refraction correction. Defaults to 10.
     */
    temperature?: number;
  };

  /**
   * A proleptic Gregorian calendar instant in Coordinated Universal Time: the
   * Gregorian calendar extended backward before 1582. Every field is an integer
   * except `second`.
   */
  export type IUtc = {
    /** Astronomical year: 0 is 1 BC; an integer at or above -4712. */
    year: number;

    /** Month of the year, 1 to 12. */
    month: number;

    /** Day of the month, 1 to the month's length in that year. */
    day: number;

    /** Hour of the day, 0 to 23. */
    hour: number;

    /** Minute of the hour, 0 to 59. */
    minute: number;

    /** Second of the minute, finite within `[0, 60]`; 60 admits a leap second. */
    second: number;
  };
}
