/**
 * The air's one owner: the density every drag law reads when its caller states
 * none, so an arrow, a ball and round shot fly through the same air.
 *
 * The value is the density of the ICAO Standard Atmosphere at mean sea level,
 * 1.225 kg/m³, defined there with the sea-level temperature 15 °C and pressure
 * 101 325 Pa (ICAO Doc 7488, Manual of the ICAO Standard Atmosphere; ISO
 * 2533:1975). A film's air at another height or temperature is the caller's to
 * state.
 */
export namespace AutoMovieAir {
  /**
   * The density of the ICAO Standard Atmosphere at mean sea level, kg/m³: 1.225
   * (ICAO Doc 7488; ISO 2533:1975).
   */
  export const DENSITY: number = 1.225;

  /**
   * The speed of sound in the ICAO Standard Atmosphere at mean sea level, m/s:
   * 340.294 (ICAO Doc 7488), the same air as `DENSITY`.
   */
  export const SOUND: number = 340.294;
}
