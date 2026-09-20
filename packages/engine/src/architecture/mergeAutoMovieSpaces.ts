import { IAutoMovieSpace } from "@automovie/interface";

/**
 * Merge several subject-owned support spaces into one stage space.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `mergeAutoMovieSpaces` merges several subject-owned support spaces into one stage space. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `mergeAutoMovieSpaces` performs auto movie spaces merge when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export const mergeAutoMovieSpaces = (
  id: string,
  spaces: readonly IAutoMovieSpace[],
): IAutoMovieSpace => ({
  id,
  surfaces: spaces.flatMap((space) => space.surfaces),
  walkable: spaces.flatMap((space) => space.walkable),
});
