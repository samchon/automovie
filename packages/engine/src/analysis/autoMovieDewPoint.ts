/**
 * Magnus coefficients for saturation vapour pressure over water, as published
 * by Sonntag: `a` is dimensionless and `b` is in degrees Celsius.
 *
 * These coefficients select the engine's fitted water-vapour-pressure approximation, rather than an authored material or weather record; other dew-point approximations use different coefficients.
 */
const MAGNUS_A: number = 17.62;

const MAGNUS_B: number = 243.12;

/**
 * Dew point of moist air by the Magnus form, in degrees Celsius.
 *
 * `gamma = ln(RH) + a*T/(b+T)`, `Td = b*gamma/(a - gamma)`, with `T` in degrees
 * Celsius and `RH` as a fraction. Throws an `Error` on a non-finite temperature
 * or a humidity outside `(0, 1]`, since zero humidity has no dew point. The
 * coefficients are fitted over roughly -45 to 60 degC, and a temperature outside that range is not refused. The saturated identity is mathematical; floating-point evaluation has rounding error and can become nonfinite at the formula's singularities, including T = -243.12 degC.
 *
 * This is the only dew-point formula in the engine; the envelope analyzer
 * calls it for the indoor air.
 *
 * @param temperature Dry-bulb air temperature in degrees Celsius; finite.
 * @param relativeHumidity Relative humidity as a fraction in `(0, 1]`.
 * @returns Dew-point temperature in degrees Celsius.
 *
 * @evidence contracts/common.md#principled-implementation Inverts the Magnus saturation-vapour-pressure approximation in closed form with coefficients 17.62 and 243.12. The approximate fitted range is -45 to 60 degC and is not enforced; finite inputs outside it can produce a nonfinite result at a denominator singularity or through overflow, and this function does not admit its output.
 * @evidence contracts/common.md#clear-and-simple-design One exported function owns the constants and the formula, and `analyzeAutoMovieEnvelope` calls it instead of keeping a private copy, so there is one dew-point rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input is special-cased; zero humidity is refused because `ln(0)` has no value, not mapped to a placeholder, and the envelope analyzer turns that case into a gap before calling.
 * @evidence contracts/common.md#meaningful-documentation States formula, units, input refusals, unenforced fitted range, the mathematical saturated identity and numerical singularities, and the envelope caller.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, one logarithm and a few arithmetic operations, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function; the envelope analyzer computes the one indoor dew point once per study and shares it across every assembly.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Works on two scalar arguments and one local, so no object, handle or task is created or kept.
 * @author Samchon
 */
export const autoMovieDewPoint: (temperature: number, relativeHumidity: number) => number = (
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
