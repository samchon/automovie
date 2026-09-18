/**
 * Shared by builtEnvironmentContainsPoint, builtEnvironmentSpaceFidelity, builtEnvironmentAdjacentSpaces, builtEnvironmentSpaceConnectors, builtEnvironmentSpaceBoundaries, builtEnvironmentSpaceSurfaces, builtEnvironmentSpaceNodes, builtEnvironmentSpacePopulations, builtEnvironmentSpaceContentBounds, builtEnvironmentBuildingOfSpace, builtConnectorSection, builtEnvironmentDescendantSpaces, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const requireSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): void => {
  if (!environment.spaces.some((space) => space.id === spaceId))
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
};
