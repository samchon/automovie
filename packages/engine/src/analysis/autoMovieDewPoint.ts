/**
 * Magnus coefficients for saturation vapour pressure over water, as published
 * by Sonntag: `a` is dimensionless and `b` is in degrees Celsius.
 *
 * They are constants of the equation, not a material table: every dew point
 * anyone computes from air temperature and relative humidity uses these two
 * numbers, so they are capability rather than content.
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
 * outside that range is not refused. At `RH = 1` the result equals the
 * temperature.
 *
 * This is the only dew-point formula in the engine; the envelope analyzer
 * calls it for the indoor air.
 *
 * @param temperature Dry-bulb air temperature in degrees Celsius; finite.
 * @param relativeHumidity Relative humidity as a fraction in `(0, 1]`.
 * @returns Dew-point temperature in degrees Celsius.
 *
 * @evidence contracts/common.md#principled-implementation Inverts the Magnus saturation-vapour-pressure approximation with Sonntag's coefficients in closed form; the fit is accurate over roughly -45 to 60 degC and still returns a number outside it, a limitation the documentation states rather than refusing those temperatures.
 * @evidence contracts/common.md#clear-and-simple-design One exported function owns the constants and the formula, and `analyzeAutoMovieEnvelope` calls it instead of keeping a private copy, so there is one dew-point rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input is special-cased; zero humidity is refused because `ln(0)` has no value, not mapped to a placeholder, and the envelope analyzer turns that case into a gap before calling.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the formula, units, refused inputs and why, the fitted range and that it is not enforced, the saturated identity, and the single caller inside the engine.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, one logarithm and a few arithmetic operations, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function; the envelope analyzer computes the one indoor dew point once per study and shares it across every assembly.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Works on two scalar arguments and one local, so no object, handle or task is created or kept.
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
  const gamma: number =
    Math.log(relativeHumidity) +
    (MAGNUS_A * temperature) / (MAGNUS_B + temperature);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
};
