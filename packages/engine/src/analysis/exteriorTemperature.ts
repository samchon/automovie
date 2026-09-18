/** The exterior air temperature an instant supplies, or null.  * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeLayer` declares one material thickness and conductivity used to calculate envelope thermal resistance.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The layer record contributes one explicit `thickness / conductivity` resistance to a resolved assembly load path.
 * @author Samchon
 */
export const exteriorTemperature = (
  instant: IAutoMovieEnvironmentInstant | null,
): number | null => (instant === null ? null : instant.outdoorAirTemperature);
