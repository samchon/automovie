/**
 * Shared by builtConnectorGeometry, builtConnectorCarriagePlacements, builtConnectorSectionAt, builtConnectorSection, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const requireConnector = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
): IAutoMovieBuiltConnector => {
  const connector = environment.connectors.find(
    (candidate) => candidate.id === connectorId,
  );
  if (connector === undefined)
    throw new Error(
      `built environment "${environment.id}" has no connector "${connectorId}"`,
    );
  return connector;
};
