/**
 * Magnus coefficients for saturation vapour pressure over water, as published
 * by Sonntag: `a` is dimensionless and `b` is in degrees Celsius.
 *
 * They are constants of the equation, not a material table: every dew point
 * anyone computes from air temperature and relative humidity uses these two
 * numbers, so they are capability rather than content.
 */
const MAGNUS_A = 17.62;

const MAGNUS_B = 243.12;

/**
 * Dew point of moist air by the Magnus form, in degrees Celsius.
 *
 * `gamma = ln(RH) + a*T/(b+T)`, `Td = b*gamma/(a - gamma)`, with `T` in degrees
 * Celsius and `RH` as a fraction. Throws an `Error` on a non-finite temperature
 * or a humidity outside `(0, 1]`, since zero humidity has no dew point. The
 * coefficients are fitted over roughly -45 to 60 degC, and a temperature
 * outside that range is not refused.
 *
 * It is exported as the public dew-point function, but it is not the only
 * one: `analyzeAutoMovieEnvelope` keeps a private copy of the same constants
 * and formula instead of calling it.
 *
 * @author Samchon
 */
export const autoMovieDewPoint = (
  temperature: number,
  relativeHumidity: number,
): number => {
  if (!Number.isFinite(temperature))
    throw new Error(
      `a dew point needs a finite air temperature, but was ${temperature}`,
    );
  if (
    !Number.isFinite(relativeHumidity) ||
    relativeHumidity <= 0 ||
    relativeHumidity > 1
  )
    throw new Error(
      `a dew point needs a relative humidity within (0, 1], but was ${relativeHumidity}`,
    );
  return magnusDewPoint(temperature, relativeHumidity);
};

const magnusDewPoint = (
  temperature: number,
  relativeHumidity: number,
): number => {
  const gamma =
    Math.log(relativeHumidity) +
    (MAGNUS_A * temperature) / (MAGNUS_B + temperature);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
};
