/**
 * Shared by analyzeAutoMovieEnvelope, autoMovieDewPoint, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeLayer` declares one material thickness and conductivity used to calculate envelope thermal resistance.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The layer record contributes one explicit `thickness / conductivity` resistance to a resolved assembly load path.
 * @author Samchon
 */
export const magnusDewPoint = (
  temperature: number,
  relativeHumidity: number,
): number => {
  const gamma =
    Math.log(relativeHumidity) +
    (MAGNUS_A * temperature) / (MAGNUS_B + temperature);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
};
