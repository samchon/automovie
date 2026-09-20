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
 * Dew point of moist air by the Magnus form.
 *
 * `gamma = ln(RH) + a*T/(b+T)`, `Td = b*gamma/(a - gamma)`. Exported because it
 * is the one place this project turns humidity into a temperature, and a second
 * copy would be a second answer.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `autoMovieDewPoint` turns declared air temperature and relative humidity into the comparison temperature used for condensation evidence.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The function evaluates the single Magnus-form moisture boundary shared by envelope risk calculations.
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
