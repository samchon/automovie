import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

/**
 * Report the support patches usable in a logical space and its descendants.
 *
 * Support and walkability are separate facts: a roof deck may carry a prop
 * without being somewhere a performer may walk. Both are answered by the stable
 * surface id the lowered stage space also cites, so a caller never has to match
 * geometry to learn which patch it is holding.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentSpaceSurfaces` reports the support patches usable in a logical space and its descendants. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentSpaceSurfaces` collects support patches owned by a logical space or any of its descendants.
 */
export const builtEnvironmentSpaceSurfaces = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): Array<{ space: string; surface: string; walkable: boolean }> => {
  requireSpace(environment, spaceId);
  const included = descendantSpaces(environment.spaces, spaceId);
  const walkable = new Set(environment.walkable);
  return environment.surfaces
    .filter((entry) => included.has(entry.space))
    .map((entry) => ({
      space: entry.space,
      surface: entry.surface.id,
      walkable: walkable.has(entry.surface.id),
    }));
};
