/**
 * Magnus coefficients for saturation vapour pressure over water, as published
 * by Sonntag: `a` is dimensionless and `b` is in degrees Celsius.
 *
 * These coefficients select the engine's fitted water-vapour-pressure
 * approximation, rather than an authored material or weather record; other
 * dew-point approximations use different coefficients.
 */
const MAGNUS_A: number = 17.62;

const MAGNUS_B: number = 243.12;

/**
 * Dew point of moist air by the Magnus form, in degrees Celsius.
 *
 * `gamma = ln(RH) + a*T/(b+T)`, `Td = b*gamma/(a - gamma)`, with `T` in degrees
 * Celsius and `RH` as a fraction. Throws an `Error` on a non-finite temperature
 * or a humidity outside `(0, 1]`, since zero humidity has no dew point. The
 * coefficients are fitted over roughly -45 to 60 degC, and a temperature
 * outside that range is not refused. The saturated identity is mathematical;
 * floating-point evaluation has rounding error and can become nonfinite at the
 * formula's singularities, including T = -243.12 degC.
 *
 * This is the only dew-point formula in the engine; the envelope analyzer calls
 * it for the indoor air.
 *
 * @param temperature Dry-bulb air temperature in degrees Celsius; finite.
 * @param relativeHumidity Relative humidity as a fraction in `(0, 1]`.
 * @returns Dew-point temperature in degrees Celsius.
 */
export function autoMovieDewPoint(
  temperature: number,
  relativeHumidity: number,
): number {
  if (relativeHumidity <= 0 || relativeHumidity > 1)
    throw new Error(
      `a dew point needs a relative humidity within (0, 1], but was ${relativeHumidity}`,
    );
  const gamma: number =
    Math.log(relativeHumidity) +
    (MAGNUS_A * temperature) / (MAGNUS_B + temperature);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
}
