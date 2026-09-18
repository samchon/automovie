/**
 * Shared by analyzeAutoMovieSpaceAir, autoMovieDewPoint, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeLayer` declares one material thickness and conductivity used to calculate envelope thermal resistance.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The layer record contributes one explicit `thickness / conductivity` resistance to a resolved assembly load path.
 * @author Samchon
 */
export const validateAirRequest = (request: IAutoMovieSpaceAirRequest): void => {
  for (const [label, value] of [
    ["id", request.id],
    ["subject", request.subject],
    ["input revision", request.inputRevision],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`a ventilation study must state a non-blank ${label}`);
  if (!Number.isFinite(request.volume) || request.volume <= 0)
    throw new Error(
      `a ventilated space volume must be a finite number above zero, but was ${request.volume}`,
    );
  if (
    request.supplyFlow !== null &&
    (!Number.isFinite(request.supplyFlow) || request.supplyFlow < 0)
  )
    throw new Error(
      `a supply flow must be null or a finite number at or above zero, but was ${request.supplyFlow}`,
    );
  if (!Number.isSafeInteger(request.occupants) || request.occupants < 0)
    throw new Error(
      `an occupancy must be a whole number at or above zero, but was ${request.occupants}`,
    );
  for (const key of ["occupantCarbonDioxide", "outdoorCarbonDioxide"] as const)
    if (!Number.isFinite(request[key]) || request[key] < 0)
      throw new Error(
        `${key} must be a finite number at or above zero, but was ${request[key]}`,
      );
  assertAutoMovieAnalysisTargets(request.targets);
};
