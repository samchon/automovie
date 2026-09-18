/**
 * Shared by builtEnvironmentContainsPoint, builtEnvironmentSpaceFidelity, builtEnvironmentSpaceSurfaces, builtEnvironmentSpaceNodes, builtEnvironmentSpacePopulations, builtEnvironmentSpaceContentBounds, builtEnvironmentBuildingOfSpace, builtEnvironmentDescendantSpaces, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const descendantSpaces = (
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> => {
  const included = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const space of spaces)
      if (
        space.parent !== null &&
        included.has(space.parent) &&
        !included.has(space.id)
      ) {
        included.add(space.id);
        changed = true;
      }
  }
  return included;
};
